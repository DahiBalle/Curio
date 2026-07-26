# Feature-Based Frontend Architecture — Persona Feed App

A full restructuring guide: final folder structure, what goes in each layer and why, worked refactor examples, strict boundaries, and how data/state actually flows through the app. Companion to `frontend_hooks_utils_architecture.md` (that doc goes deeper on hooks/utils specifically — this one covers the whole project).

---

## 1. Final folder structure

```
src/
├── app/                          # app-level wiring, not a "feature"
│   ├── App.jsx                   # root component: providers + router outlet
│   ├── AppProviders.jsx          # composes all context providers in one place
│   └── router.jsx                # route table, lazy-loaded feature pages
│
├── features/                     # business domains — the core of the app
│   ├── auth/
│   ├── onboarding/
│   ├── persona/
│   ├── feed/
│   └── interactions/
│
├── components/                   # SHARED UI ONLY — no domain knowledge
│   ├── ui/                       # Button, Modal, Input, Skeleton, Badge
│   └── layout/                   # Navbar, PageContainer, Sidebar
│
├── hooks/                        # GLOBAL technical hooks, zero domain knowledge
│   ├── useDebounce.js
│   ├── useIntersectionObserver.js
│   └── usePrevious.js
│
├── services/                     # shared API client — the ONLY place fetch/axios config lives
│   ├── client.js                 # axios instance, base URL, interceptors, auth header
│   └── apiError.js               # normalizes error shapes across all endpoints
│
├── utils/                        # GLOBAL pure helpers, zero React, zero network
│   ├── formatters.js
│   ├── array.js
│   └── validators.js
│
├── context/                      # APP-WIDE context only (not feature-scoped)
│   └── AuthContext.jsx           # used by nearly every feature; lives here, not inside auth/
│
├── config/
│   └── constants.js               # env-driven config, feature flags, enums
│
└── main.jsx
```

**Why `services/` is top-level and not per-feature:** the axios instance, base URL, auth-token interceptor, and error normalization must be identical everywhere — there is exactly one HTTP client in this app. Centralizing it means an auth-token refresh fix, for instance, is one file change, not five. Each *feature* still owns its own endpoint functions (see Section 3) — they just all import the same shared client from here instead of each configuring their own.

**Why `AuthContext` sits in top-level `context/` while `PersonaContext` sits inside `features/persona/`:** the rule is *breadth of use*, not importance. Auth state (is logged in, current user, token) is read by nearly every feature — onboarding, feed, personas, interactions all need it. Persona state is only relevant to features that display or filter by persona. If nearly the whole app needs it → `context/`. If it's one feature's internal concern that a couple of other features consume through its public `index.js` → it stays inside that feature.

---

## 2. What each layer is for, specifically

| Layer | Job | Never contains |
|---|---|---|
| `features/*` | One business domain end-to-end: its own UI, its own hooks, its own API calls | Code another unrelated feature needs directly (put shared stuff in `components/`, `hooks/`, or `utils/` instead) |
| `components/` | UI that has **zero opinion** about your product — a `Button` doesn't know what a "persona" is | Any `fetch`, any feature-specific prop like `personaId`, any business validation |
| `hooks/` (global) | Stateful React logic that would be identical in a totally different app | Anything that imports a feature's API file, anything domain-specific |
| `services/` | Network requests — build the request, return the response/throw a normalized error | State, JSX, retries-with-UI-feedback (that's the hook's job, wrapping the service call) |
| `utils/` | Pure, deterministic functions | State, `fetch`, React, side effects of any kind |
| `context/` (app-wide only) | Cross-feature global state: auth, theme, active persona if truly global | Business logic itself — context holds state and setters; the *logic* that decides what to set lives in a hook that wraps `useContext` |

---

## 3. Per-feature internal structure

### The template

```
features/{feature}/
├── api/                  # feature-specific endpoint functions, using the shared client
│   └── {feature}Api.js
├── components/           # UI used only within this feature
│   └── ...
├── hooks/                # stateful logic specific to this feature
│   └── use{Feature}.js
├── pages/                # route-level components (only if this feature owns routes)
│   └── {Feature}Page.jsx
├── context/              # only if state must be shared across many components in this feature
│   └── {Feature}Context.jsx
├── utils/                # pure helpers specific to this feature's domain
│   └── {feature}Utils.js
└── index.js              # PUBLIC SURFACE — the only things other features are allowed to import
```

**Why the `index.js` barrel matters more than it looks:** it's what prevents a "feed" component from reaching into `features/persona/hooks/usePersona.js` directly via a deep import. Other features import `from 'features/persona'` and get exactly what that feature chooses to expose (typically `usePersona` and maybe `PersonaSwitcher`) — internal components, internal helpers, and internal context stay unreachable from outside. This is the actual mechanism that keeps features independent as the app grows; without it, "feature-based" is just a folder naming convention with no real isolation.

```javascript
// features/persona/index.js
export { usePersona } from './hooks/usePersona';
export { PersonaSwitcher } from './components/PersonaSwitcher';
// PersonaContext, internal components, internal utils are NOT exported —
// nothing outside this folder should touch them directly.
```

### Worked example: `features/feed/`

```
features/feed/
├── api/
│   └── feedApi.js
├── components/
│   ├── Feed.jsx
│   ├── PostCard.jsx
│   └── FeedSkeleton.jsx
├── hooks/
│   ├── useFeed.js
│   └── useDwellTracking.js
├── pages/
│   └── HomeFeedPage.jsx
├── utils/
│   └── feedUtils.js          # dedupeById, sortByRecency — feed-domain but still pure
└── index.js
```

```javascript
// features/feed/api/feedApi.js — ONLY request-building, no state, no React
import { client } from '../../../services/client';

export const feedApi = {
  getFeed: (personaId, page = 1) =>
    client.get('/feed/', { params: { persona: personaId, page } }).then((r) => r.data),
};
```

```javascript
// services/client.js — the ONE shared HTTP client
import axios from 'axios';

export const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error)) // from ./apiError.js
);
```

Notice the layering: `feedApi.js` doesn't know what a token is or how errors get normalized — that's `services/client.js`'s job, configured once. `feedApi.js` only knows "here's the endpoint, here's the shape of the response." This is what lets you add a global "if 401, redirect to login" rule in exactly one place and have it apply to every feature automatically.

### Worked example: `features/onboarding/` (multi-step flow)

```
features/onboarding/
├── api/
│   └── onboardingApi.js
├── components/
│   ├── InterestPicker.jsx
│   └── OnboardingProgressBar.jsx
├── hooks/
│   └── useOnboarding.js
├── pages/
│   └── OnboardingPage.jsx
└── index.js
```

```javascript
// features/onboarding/hooks/useOnboarding.js
import { useReducer, useCallback } from 'react';
import { onboardingApi } from '../api/onboardingApi';

const MIN_INTERESTS = 3;

function reducer(state, action) {
  switch (action.type) {
    case 'TOGGLE_INTEREST': {
      const next = new Set(state.selected);
      next.has(action.id) ? next.delete(action.id) : next.add(action.id);
      return { ...state, selected: next };
    }
    case 'NEXT_STEP':
      return { ...state, step: state.step + 1 };
    case 'BACK_STEP':
      return { ...state, step: Math.max(1, state.step - 1) };
    default:
      return state;
  }
}

export function useOnboarding() {
  const [state, dispatch] = useReducer(reducer, { step: 1, selected: new Set() });

  const toggleInterest = useCallback((id) => dispatch({ type: 'TOGGLE_INTEREST', id }), []);
  const nextStep = useCallback(() => dispatch({ type: 'NEXT_STEP' }), []);
  const backStep = useCallback(() => dispatch({ type: 'BACK_STEP' }), []);
  const canProceed = state.selected.size >= MIN_INTERESTS;

  const submit = useCallback(
    () => onboardingApi.submit(Array.from(state.selected)),
    [state.selected]
  );

  return { ...state, toggleInterest, nextStep, backStep, canProceed, submit };
}
```

**Why `useReducer` here instead of two `useState` calls:** once a flow has more than one piece of state that changes *together* (step + selections, later maybe validation errors per step), a reducer keeps every valid transition in one switch statement you can read top to bottom, instead of scattered `setStep`/`setSelected` calls that could theoretically get called in an inconsistent order from different places. This is still **not** Redux — it's a single `useReducer` local to one hook, gone the moment you navigate away. Reach for a real state machine library (XState) only if steps start branching conditionally (e.g., "skip step 3 if the user picked category X") — plain reducer is enough for a linear wizard.

---

## 4. Refactor walkthrough: messy → modular

### Before — a real "loosely organized" login component

```jsx
// ❌ src/components/LoginForm.jsx — everything in one place
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.includes('@')) {
      setError('Please enter a valid email');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('https://api.myapp.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const data = await res.json();
      localStorage.setItem('authToken', data.token);
      navigate('/feed');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button disabled={loading}>{loading ? 'Logging in...' : 'Log in'}</button>
    </form>
  );
}
```

**What's actually wrong, concretely:** the base URL is hardcoded (breaks the moment you need staging vs. production), validation logic is inline and untestable without rendering the form, the fetch call has no shared error normalization (a 500 and a 401 both just say "Invalid credentials"), and `localStorage`/navigation side effects are tangled into the same function as form-field state. None of this is reusable if you need a second login entry point (e.g., a modal login on the feed page).

### After — split across the four layers

```javascript
// features/auth/api/authApi.js
import { client } from '../../../services/client';

export const authApi = {
  login: (email, password) => client.post('/auth/login', { email, password }).then((r) => r.data),
};
```

```javascript
// utils/validators.js
export function isValidEmail(email) {
  return /\S+@\S+\.\S+/.test(email);
}
```

```javascript
// features/auth/hooks/useLogin.js
import { useState, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { AuthContext } from '../../../context/AuthContext';
import { isValidEmail } from '../../../utils/validators';

export function useLogin() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { setToken } = useContext(AuthContext);
  const navigate = useNavigate();

  const login = useCallback(async (email, password) => {
    if (!isValidEmail(email)) {
      setError('Please enter a valid email');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { token } = await authApi.login(email, password);
      setToken(token); // AuthContext handles persistence
      navigate('/feed');
    } catch (err) {
      setError(err.message); // already normalized by services/apiError.js
    } finally {
      setLoading(false);
    }
  }, [setToken, navigate]);

  return { login, error, loading };
}
```

```jsx
// features/auth/components/LoginForm.jsx — renders only
import { useState } from 'react';
import { useLogin } from '../hooks/useLogin';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, error, loading } = useLogin();

  return (
    <form onSubmit={(e) => { e.preventDefault(); login(email, password); }}>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" />
      {error && <p className="text-red-600">{error}</p>}
      <button disabled={loading}>{loading ? 'Logging in...' : 'Log in'}</button>
    </form>
  );
}
```

Now: `isValidEmail` is testable with one line, no rendering. `useLogin` is testable with `renderHook` and a mocked `authApi`. `LoginForm` can be dropped into a modal or a full page unchanged, and a second entry point (e.g., a "quick login" modal on the feed) reuses `useLogin` directly instead of copy-pasting the fetch/validation logic.

---

## 5. Strict boundaries

**Never in `components/`:**
- `fetch`/`axios` calls of any kind
- `useEffect` that fetches data (a data-fetching effect belongs in a hook the component calls)
- Business validation rules (e.g., "must select 3+ interests") — components read a boolean like `canProceed` from a hook, they don't compute it
- Direct `localStorage`/`sessionStorage` access — route it through context/hooks so there's one place that changes if storage strategy changes

**Never in `hooks/` (global, `src/hooks/`):**
- Anything that imports a feature's `api/*.js` file — that instantly makes it domain-specific and it belongs in that feature's own `hooks/` folder instead
- JSX — a hook returns data/functions, never markup

**Never in `hooks/` (feature-scoped, either location):**
- Direct `fetch`/`axios` calls — always go through that feature's `api/*.js`, even if it feels like "just one line" to inline it; this is what keeps request-shape changes confined to one file

**Never in `utils/`:**
- `useState`/`useEffect`/`useContext` — that's automatically a hook, not a util
- Network calls
- Anything non-deterministic without the varying input made explicit (e.g., don't call `Date.now()` internally — accept "now" as a parameter so tests can control it)

**Never in `services/`:**
- Business logic like "retry 3 times then show a toast" — that user-facing behavior belongs in the hook wrapping the call; `services/` just makes the request and returns/throws
- State of any kind — no module-level `let cachedUser = null` inside a service file; if you need caching, that's a hook's or a library's (e.g., React Query) job

---

## 6. Data flow

### Frontend ↔ backend, step by step

```
Component
   │  calls a hook function (e.g., login(email, password))
   ▼
Feature hook (features/{feature}/hooks/use{X}.js)
   │  calls the feature's api function
   ▼
Feature api layer (features/{feature}/api/{feature}Api.js)
   │  uses the shared client
   ▼
services/client.js
   │  attaches auth header, sends the HTTP request
   ▼
Django REST API
   │  responds (or errors)
   ▼
services/client.js interceptor
   │  normalizes error shape via services/apiError.js
   ▼
Feature api layer
   │  returns parsed data / throws normalized error
   ▼
Feature hook
   │  updates its own state (or context), triggers navigation, etc.
   ▼
Component
      re-renders with new state from the hook
```

Every arrow is a strict one-directional dependency — a component never imports `services/client.js` directly, and `services/` never imports anything from `features/`. If you can trace an import going the "wrong way" (e.g., `services/client.js` importing something from `features/feed/`), that's a sign a boundary got crossed.

### State flow across components

Default to **local state**, lift only when needed, use **context only when several components genuinely need the same value without a sane common ancestor to lift to**:

1. **Local (`useState` inside one component)** — form field values, whether a dropdown is open. Nobody else needs it.
2. **Lifted to a shared parent** — two sibling components need the same value; move the state up to their nearest common parent and pass down via props. This is still not context — prop-drilling one or two levels is fine and often clearer than reaching for context prematurely.
3. **Context** — the value is needed by components that don't share a reasonably close parent, or is needed by nearly every feature (`AuthContext`), or represents an app concept that legitimately spans many components (`PersonaContext` — the active persona affects the feed, the switcher, and interaction logging, none of which are siblings under a convenient shared parent).
4. **Server state (fetched data)** — this isn't really "app state" at all; it's a cache of what the server said. `useFeed`'s `posts` array is server state, not client state — don't put it in Redux/context. If this ever gets complex enough (stale-while-revalidate, cache invalidation across features), that's when a library like **React Query** earns its place — not before.

### Multi-step flows (onboarding) specifically

Keep the entire flow's state in **one hook** (`useOnboarding`, shown in Section 3) rather than one `useState` per step component, and pass step components only what they need as props:

```jsx
// features/onboarding/pages/OnboardingPage.jsx
import { useOnboarding } from '../hooks/useOnboarding';
import { InterestPicker } from '../components/InterestPicker';

export function OnboardingPage() {
  const { step, selected, toggleInterest, nextStep, canProceed, submit } = useOnboarding();

  if (step === 1) {
    return (
      <InterestPicker
        selected={selected}
        onToggle={toggleInterest}
        onNext={nextStep}
        canProceed={canProceed}
      />
    );
  }
  // step === 2, etc. — each step component stays dumb, just renders props it's given
  return <ConfirmationStep onSubmit={submit} />;
}
```

`InterestPicker` never touches the reducer, never calls the API, never decides validation — it just renders what it's handed and calls `onToggle`/`onNext`. This is what makes each step trivially reusable/testable in isolation, and what makes adding a step later (e.g., a persona-naming step before confirmation) a matter of adding one more `if (step === N)` branch and one more dumb component, not restructuring existing ones.

---

## 7. Best practices & common mistakes

**Do:**
- Let every feature have exactly one `index.js` that defines what's public; enforce it by convention (and optionally an ESLint import-restriction rule once the team grows) so nobody deep-imports another feature's internals.
- Keep `services/client.js` as the single place that knows about auth headers, base URLs, and error normalization.
- Default to local state; only lift or contextify when you have a concrete reason, not "just in case."
- Extract a hook the moment logic is about to be duplicated — not before, and not "just in case" either.

**Common mistakes to avoid:**
- **Splitting only by "components vs. pages"** — this is the exact non-scalable structure the request explicitly wants to move away from. "Components" and "pages" aren't domains; "feed," "onboarding," and "persona" are. A `components/` folder with 40 unrelated files tells you nothing about the product; `features/feed/` does.
- **Reaching for Redux/Zustand on day one** — for this app, `AuthContext` + `PersonaContext` + local/hook state covers everything described. Add a state library only when you can point to a specific pain (e.g., genuinely global state mutated from many unrelated places) — not preemptively.
- **Putting fetch calls inside components "just this once"** — this is how the "loosely organized, mixed logic" problem you're trying to escape re-creates itself. The service layer's value only holds if it's used *every* time, with no exceptions for "quick" features.
- **Treating server-fetched data as client state** — storing `posts` in Redux/context and manually mutating it on every interaction duplicates what the server already knows and drifts out of sync. Keep fetched data in the hook that fetched it (or, once the app grows, a proper server-state library) and treat "what the server said" and "what the user is doing in the UI" as two different kinds of state.
- **Building the `ml/`-adjacent frontend structure speculatively** — when ML features need frontend surface later (e.g., "why am I seeing this" explanations, an ML-tuned onboarding flow), add that as its own feature folder at that time, following this same template — don't scaffold empty folders for it now.
