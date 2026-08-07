# Building a Persona-Based, Topic-Driven Feed (Reddit-like Platform)
### A complete, beginner-friendly build guide — React + Django + PostgreSQL + Python ML

---

## How to read this guide

You don't need to understand everything before you start coding. This guide is built so you can **build in layers**: get something dumb-but-working first, then make each layer smarter. Section 9 gives you the actual order to build things in — read that first if you want the "map," then come back to earlier sections for the "how."

Every technical term is explained the first time it shows up, usually with a plain-English analogy before the technical version.

---

## 1. Overall System Architecture

### The big picture

Think of your feed system as a **pipeline** — a series of stations content passes through before it reaches the user's screen, like an assembly line that starts with "everything that exists" and ends with "the 20 posts this specific user sees right now."

```
                    ┌─────────────────────┐
                    │   ALL POSTS IN DB    │   (millions, potentially)
                    └──────────┬───────────┘
                               ▼
                    ┌─────────────────────┐
                    │ 1. CANDIDATE GEN     │   → ~500-1000 posts
                    └──────────┬───────────┘
                               ▼
                    ┌─────────────────────┐
                    │ 2. FILTERING         │   → ~200-500 posts
                    └──────────┬───────────┘
                               ▼
                    ┌─────────────────────┐
                    │ 3. RANKING (ML)      │   → scored + sorted
                    └──────────┬───────────┘
                               ▼
                    ┌─────────────────────┐
                    │ 4. RE-RANKING        │   → diversity/freshness fixes
                    └──────────┬───────────┘
                               ▼
                    ┌─────────────────────┐
                    │ 5. FEED DELIVERY     │   → 20-30 posts to user
                    └──────────┬───────────┘
                               ▼
                    ┌─────────────────────┐
                    │ 6. FEEDBACK LOOP     │   → logs clicks/likes/dwell
                    └──────────┬───────────┘
                               │
                               └──────► feeds back into steps 1-3
```

Why split it into stages instead of "just score everything"? Because **scoring is expensive**, and you have millions of posts but only need ~20-30. You don't want to run the ranking step on every post in the database — you want to cheaply narrow down to a few hundred good *candidates* first, and only spend computation on those.

### Stage 1: Candidate Generation

**What it does:** Quickly pulls a rough pool of "posts that *might* be relevant" from millions of posts, using cheap methods.

**Why it's needed:** You can't rank a million posts in real time. You need a fast way to go from "everything" to "a few hundred plausible options."

**How, concretely:** You pull candidates from multiple independent sources (this is what your spec calls "Feed Sources"), then combine them:

- **Broad-topic match** — posts sharing one of the persona's selected or engaged **broad topics** (e.g., persona is into "programming" → pull posts broad-tagged "programming"). This is the primary, cheap candidate source — full mechanics in Section 4.
- **Collaborative filtering** — "posts liked by other users who behave like this one." Simple version: "personas who engaged with the same topics as you, also engaged with this."
- **Trending/hot posts** — posts with high recent engagement velocity (likes/comments per hour), independent of personalization. This ensures new/viral content gets a chance even without a match history.
- **Followed-topic based** — posts from topics the persona explicitly follows.
- **Exploration** — a small random sample of posts *outside* the persona's usual topics, deliberately injected. This prevents "filter bubble" stagnation and lets the system discover new topics.

You typically pull ~100-200 candidates from each source, then merge and de-duplicate → ends up around 500-1000 total candidates.

### Stage 2: Filtering

**What it does:** Removes candidates that should never be shown, regardless of relevance score.

**Why it's needed:** Ranking is about "which is best," but filtering is about "which are even eligible." Mixing these up is a common beginner mistake — don't let your ranking logic try to learn "don't show already-seen posts"; just filter those out directly, it's more reliable and much cheaper.

**Typical filters:**
- Already seen/interacted with (unless you deliberately want repeats)
- Blocked users/topics
- NSFW mismatch with user settings
- Removed/deleted/reported posts
- Age limits (e.g., older than 30 days, unless it's evergreen content)

### Stage 3: Ranking (the ML part)

**What it does:** Takes the filtered candidates (a few hundred) and assigns each a score representing "how likely is this specific persona, in this specific session, to engage with this post." Then sorts by score.

**Why it's needed:** This is the actual "personalization" step. Candidate generation asks "roughly relevant?" Ranking asks "precisely, how relevant, right now, for engagement?"

Early on, this is just a formula (Section 5 covers this in detail: "start with a scoring function, no ML yet"). Later, it becomes a trained model (logistic regression → gradient boosting, etc.).

### Stage 4: Re-ranking

**What it does:** Takes the ranked list and adjusts it — not because the ranking was wrong, but because a **naive top-N by score** creates bad feed experiences:

- **Diversity** — if the top 10 posts are all from the same broad topic, force some variety in.
- **Freshness** — boost recent posts a bit so the feed doesn't feel stale, even if an older post scored slightly higher.
- **Exploration slots** — reserve a couple of feed positions for "different from the user's norm" content, regardless of score, to keep gathering signal on other topics.

**Why it's a separate stage from ranking:** Ranking answers "how relevant is this post in isolation," but re-ranking answers "what's the best *set* of posts to put together." These are genuinely different problems (this is sometimes called "slate optimization" if you want to look it up later — not needed now).

### Stage 5: Feed Delivery

**What it does:** Packages the final ~20-30 posts and sends them to the frontend via the API, typically paginated (e.g., 10-20 at a time as the user scrolls).

### Stage 6: Feedback Loop

**What it does:** Every impression, click, like, comment, share, skip, and dwell-time-on-post is logged as an **interaction**. This data does two things:
1. **Updates topic affinity signals quickly** (session-level, lightweight, near-real-time) — covered in Section 7.
2. **Accumulates as training data** for periodically retraining the ranking model — covered in Section 8.

This closes the loop: today's interactions shape tomorrow's (and even the next scroll's) feed.

---

## 2. Project Structure

### High-level layout

```
reddit-clone/
├── frontend/                  # React app
├── backend/                   # Django project
│   ├── manage.py
│   ├── config/                # Django settings, urls, wsgi/asgi
│   ├── accounts/               # User auth app
│   ├── personas/                # Persona model + logic
│   ├── posts/                   # Post + Topic models
│   ├── interactions/            # Interaction tracking
│   ├── feed/                    # Feed generation orchestration
│   └── ml/                      # ranking + topic logic lives HERE (see below)
└── docker-compose.yml          # Postgres + backend + (later) ML service
```

### Frontend (React) structure

```
frontend/
├── src/
│   ├── api/
│   │   └── client.js            # axios instance, base URL, auth headers
│   ├── components/
│   │   ├── Feed/
│   │   │   ├── Feed.jsx          # main feed list, infinite scroll
│   │   │   ├── PostCard.jsx      # single post render
│   │   │   └── FeedSkeleton.jsx  # loading state
│   │   ├── Persona/
│   │   │   ├── PersonaSwitcher.jsx   # dropdown/tab UI to switch active persona
│   │   │   └── PersonaCreateModal.jsx
│   │   ├── Onboarding/
│   │   │   └── InterestPicker.jsx     # Pinterest-style topic selection (broad + narrow)
│   │   └── Common/
│   │       └── Navbar.jsx
│   ├── hooks/
│   │   ├── useFeed.js             # fetches /feed, handles pagination
│   │   └── useInteractionTracker.js  # tracks dwell time, sends /interact
│   ├── context/
│   │   └── PersonaContext.jsx     # holds "currently active persona" globally
│   ├── pages/
│   │   ├── HomePage.jsx
│   │   ├── OnboardingPage.jsx
│   │   └── ProfilePage.jsx
│   └── App.jsx
```

**Key idea for the persona switcher:** the active persona ID should live in global state (Context, or Redux/Zustand if you prefer) and get sent with every `/feed` and `/interact` API call — this is what tells the backend *which* persona's topic affinities/history to use.

**Dwell time tracking**, in simple terms: when a post scrolls into view, start a timer (`performance.now()`); when it scrolls out of view (via `IntersectionObserver`), compute the elapsed time and send it as part of the interaction event. Don't send this on every frame — batch it (e.g., send when the post leaves the viewport, or every N seconds).

### Backend (Django) structure

```
backend/
├── accounts/
│   ├── models.py        # User (extend Django's AbstractUser if needed)
│   ├── serializers.py
│   ├── views.py          # signup, login, onboarding topics
│   └── urls.py
├── personas/
│   ├── models.py        # Persona, PersonaTopic models
│   ├── serializers.py
│   ├── views.py          # CRUD for personas, switch active persona
│   └── urls.py
├── posts/
│   ├── models.py        # Post, Topic models
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── interactions/
│   ├── models.py        # Interaction model (impression/click/like/dwell/etc.)
│   ├── serializers.py
│   ├── views.py          # POST /interact
│   └── urls.py
├── feed/
│   ├── services/
│   │   ├── candidate_generation.py
│   │   ├── filtering.py
│   │   ├── ranking.py
│   │   └── reranking.py
│   ├── views.py          # GET /feed  → orchestrates the pipeline
│   └── urls.py
└── ml/
    ├── topics/
    │   ├── candidate_filter.py   # broad-topic candidate filtering (Step 1)
    │   └── topic_refiner.py      # narrow-topic refinement + affinity scoring (Step 2)
    ├── ranking_model/
    │   ├── features.py           # builds feature vectors for ranking (Step 3)
    │   ├── train.py               # offline training script
    │   └── model.pkl              # saved trained model (or loaded from storage)
    └── session/
        └── session_state.py      # in-memory / Redis session topic-affinity logic
```

**Why apps are split this way:** Django's convention is one "app" per bounded concept. `feed` isn't a database model — it's an *orchestrator* that calls into `posts`, `personas`, `interactions`, and `ml` to assemble a response. Keeping ranking/topic logic in its own `ml/` module (not scattered inside `feed/views.py`) means you can test, retrain, and even later extract it into a separate service without rewriting your views.

### Where does this logic live, and does it need a separate service?

**Beginner answer: no, not at first.** Put the topic-matching and ranking code as plain Python modules inside your Django project (the `ml/` app above), imported and called directly by `feed/views.py`. This keeps everything in one deployable unit and avoids network calls, serialization overhead, and "two things to deploy" complexity while you're learning and iterating.

**When to split into a separate service later:** if your ranking model becomes heavier, or you want independent scaling (many web requests, but ranking is the bottleneck), or a different team/language owns this layer — then you'd extract `ml/` into a standalone Python service (e.g., FastAPI) that Django calls over HTTP or gRPC. This is a "when you actually hit the limit" decision, not a day-1 decision. Building it as an internal module first, with clean function boundaries, makes this extraction easy later — you're mainly swapping a Python function call for an HTTP call.

### API endpoints (initial set)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/signup` | POST | Create account |
| `/api/auth/login` | POST | Login, return token |
| `/api/onboarding/topics` | POST | Save selected topics → seeds first persona |
| `/api/personas/` | GET, POST | List / create personas |
| `/api/personas/{id}/activate` | POST | Set active persona for the session |
| `/api/topics/` | GET | List topics (broad + narrow) |
| `/api/feed/` | GET | Returns ranked feed for active persona (paginated) |
| `/api/interact/` | POST | Log an interaction (impression/click/like/dwell/skip/comment) |
| `/api/posts/{id}` | GET | Single post detail |

---

## 3. Database Design (PostgreSQL)

### Core tables

```sql
-- Users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT now()
);

-- Topics: a single table holding BOTH tiers, distinguished by `type`
CREATE TABLE topics (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,             -- e.g. "programming", "react"
    type VARCHAR(10) NOT NULL CHECK (type IN ('broad', 'narrow')),  -- enforces the two-tier structure
    description TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Personas (belongs to a user)
CREATE TABLE personas (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,           -- e.g. "Gamer", "Mellow"
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE(user_id, name)
);

-- Posts — every post has exactly ONE broad topic and ONE narrow topic
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    broad_topic_id INTEGER NOT NULL REFERENCES topics(id),   -- e.g. "programming"
    narrow_topic_id INTEGER NOT NULL REFERENCES topics(id),  -- e.g. "react"
    author_id INTEGER REFERENCES users(id),
    title VARCHAR(300) NOT NULL,
    body TEXT,
    upvotes INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now()
);

-- Interactions (the feedback loop's raw data)
CREATE TABLE interactions (
    id BIGSERIAL PRIMARY KEY,
    persona_id INTEGER REFERENCES personas(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20) NOT NULL,  -- 'impression','click','like','dwell','comment','share'
    dwell_seconds FLOAT,                     -- only relevant for 'dwell'
    created_at TIMESTAMP DEFAULT now()
);

-- Persona <-> Topic mapping — supports BOTH broad and narrow topics in one table
CREATE TABLE persona_topics (
    persona_id INTEGER REFERENCES personas(id) ON DELETE CASCADE,
    topic_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    affinity_score FLOAT DEFAULT 1.0,   -- flat weight from onboarding, refined by interactions (Section 8)
    PRIMARY KEY (persona_id, topic_id)
);
```

### Enforcing the two-tier topic structure

**What it is, in plain terms:** rather than one flat list of tags, every post is described by two levels of specificity — a **broad topic** (a general category, e.g. "programming") and a **narrow topic** (a specific slice within it, e.g. "react"). The `topics` table holds both kinds of rows, and the `type` column (constrained to `'broad'` or `'narrow'`) is what enforces that a post can't accidentally get tagged with two broad topics or two narrow topics — application code should always pick `broad_topic_id` from `type='broad'` rows and `narrow_topic_id` from `type='narrow'` rows.

**Why one `persona_topics` table instead of two separate ones (e.g. `persona_broad_topics` / `persona_narrow_topics`):** a persona simply follows a *set* of topics, some broad, some narrow — there's no behavioral difference in how the mapping works, only in what `type` the referenced topic row has. One table with a foreign key to the unified `topics` table keeps querying "everything this persona follows" a single simple join, instead of always needing to combine two tables.

The `affinity_score` column is what makes this mapping do double duty: at onboarding it's set to a flat default (cold start), and every relevant interaction nudges it up or down over time (Section 8 covers the update logic).

### Indexing strategy

Because topic matching is simple equality — "does this post's `broad_topic_id` match one of this persona's topic ids?" — ordinary B-tree indexes are all you need. No vector extension and no approximate-nearest-neighbor index are required for this system.

```sql
CREATE INDEX idx_posts_broad_topic ON posts(broad_topic_id, created_at DESC);
CREATE INDEX idx_posts_narrow_topic ON posts(narrow_topic_id, created_at DESC);
CREATE INDEX idx_persona_topics_persona ON persona_topics(persona_id);
CREATE INDEX idx_interactions_persona ON interactions(persona_id, created_at DESC);
CREATE INDEX idx_posts_created ON posts(created_at DESC);  -- for "trending/recent" queries
```

These indexes are what make the Step 1 / Step 2 queries in Section 4 fast even as the `posts` table grows into the hundreds of thousands of rows — each is a straightforward indexed lookup, not a similarity computation.

---

## 4. Topic Matching (Core Recommendation Concept)

### What are topics, in simple terms?

Rather than representing content as a point in abstract number-space, this system tags things with topics you and I could read directly — a broad category and a specific sub-category underneath it.

| Broad topic | Narrow topic (example) |
|---|---|
| programming | react |
| programming | django |
| fitness | weightlifting |
| fitness | running |

Every post gets **exactly one broad topic and one narrow topic**. Every persona can follow **as many topics as it wants, of either kind** — a persona might follow the broad topic "fitness" generally, plus the specific narrow topic "react" without following all of "programming."

### Tagging posts with topics

Posts are tagged at creation time — the author (or a moderator/community setting) picks a `broad_topic_id` and a `narrow_topic_id`, typically via two dropdowns where the narrow-topic list is filtered down to only topics belonging to the chosen broad topic. No automatic content analysis is needed for this — direct, author-chosen tagging keeps the system simple and its behavior easy to reason about.

### Giving personas topics

During onboarding, a persona selects some topics — broad, narrow, or both (Pinterest-style multi-select). Each selection becomes a row in `persona_topics` with a flat initial `affinity_score` (e.g. `1.0`). This is the persona's **cold start** preference: before any interaction data exists, the feed is built purely from these selected topics.

### The topic-based recommendation pipeline

This is the concrete logic behind Stage 1 (Candidate Generation) and Stage 3 (Ranking) from Section 1:

**Step 1 — Candidate filtering using broad topics**

Pull recent posts whose `broad_topic_id` matches any topic the persona follows. This is cheap (an indexed equality lookup) and casts a reasonably wide net.

```sql
SELECT p.*
FROM posts p
JOIN persona_topics pt ON pt.topic_id = p.broad_topic_id
WHERE pt.persona_id = :persona_id
ORDER BY p.created_at DESC
LIMIT 300;
```

**Step 2 — Refinement using narrow topic match**

Within that candidate pool, boost posts whose `narrow_topic_id` *also* matches one of the persona's followed narrow topics — a much more precise signal than the broad match alone (e.g., "programming" is broad, but following "react" specifically means this exact post is a strong fit).

```python
def narrow_topic_boost(post, persona_topic_ids):
    return 1.0 if post.narrow_topic_id in persona_topic_ids else 0.0
```

**Step 3 — Final ranking using interaction signals**

Among the broad-filtered, narrow-boosted candidates, the final order is decided by how this persona has actually behaved — combining each topic's `affinity_score` (built up from impressions, clicks, likes, and dwell time — Section 8) with freshness and popularity. This is where personalization goes beyond "matches the topics you picked": a persona that consistently skips "programming" posts despite following that topic will see its broad-topic candidates naturally lose ranking priority over time as its affinity score for that topic drops.

### Cold start vs. refinement over time

- **Cold start (no interaction history yet):** the feed is driven entirely by onboarding-selected topics — a flat `affinity_score` for each, ranked mostly by recency/popularity within those topics.
- **Refined over time:** every impression, click, like, and dwell event nudges the relevant topic's `affinity_score` for that persona (Section 8) — topics they genuinely engage with (even ones never explicitly selected at onboarding) gradually gain weight, and topics they consistently ignore lose it.

### Why not embeddings (for now)?

- **Simplicity and speed.** Topic matching is a handful of indexed equality lookups (`WHERE broad_topic_id = ...`), not a similarity computation over hundreds of numbers — easier to build, easier to debug, and fast without any specialized infrastructure.
- **Sufficient at current scale.** With a manageable, well-curated topic list, two-tier tagging already captures most of the personalization value a more complex system would — "this persona likes programming, specifically react" is directly legible from the data, not something you have to infer from a vector.
- **A legitimate future enhancement, not a requirement.** If content or personas eventually get too nuanced for a fixed topic list (e.g., distinguishing "beginner React tutorials" from "React performance deep-dives" within the same narrow topic), a semantic layer could be added later as an *additional* signal inside Step 3 — without needing to redesign this pipeline.

---

## 5. Ranking Model (the ML part)

### Start simple: a scoring function, no ML yet

Before training any model, build a **hand-written formula** that combines a few signals into one score. This gets your whole pipeline working end-to-end, and gives you a baseline to compare future ML models against (if your fancy model can't beat this, something's wrong).

```python
def score_post(post, persona, session_topic_scores=None):
    broad_affinity = get_affinity(persona, post.broad_topic_id)
    narrow_affinity = get_affinity(persona, post.narrow_topic_id)
    # narrow match weighted higher — it's the more specific, stronger signal
    topic_score = (0.4 * broad_affinity) + (0.6 * narrow_affinity)

    # freshness: newer posts score higher, decaying over ~2 days
    hours_old = (now() - post.created_at).total_seconds() / 3600
    freshness = 1 / (1 + hours_old / 48)

    # popularity: log-scaled so viral posts don't totally dominate
    popularity = np.log1p(post.upvotes)

    score = (0.6 * topic_score) + (0.2 * freshness) + (0.2 * popularity / 10)

    if session_topic_scores:
        session_boost = session_topic_scores.get(post.narrow_topic_id, 0) \
            + 0.5 * session_topic_scores.get(post.broad_topic_id, 0)
        score = 0.7 * score + 0.3 * min(session_boost, 1.0)   # blend in short-term intent

    return score


def get_affinity(persona, topic_id):
    row = persona.topic_affinities.filter(topic_id=topic_id).first()
    return row.affinity_score if row else 0.0
```

The weights (`0.6`, `0.4`, `0.2`, etc.) are guesses at first — that's fine. This is a completely legitimate way to launch a feed; Reddit, YouTube, and virtually every recommendation system started with hand-tuned scoring formulas before more sophisticated ranking entered the picture.

### Upgrading to a real ML model

**Why upgrade at all?** A hand-written formula has fixed weights you guessed. An ML model *learns* the best way to combine (many more) signals from actual interaction data — including signals that interact in non-obvious ways (e.g., "freshness matters a lot for News-type posts but barely at all for Meme-type posts").

**The framing:** ranking becomes a **binary classification problem** — "given this persona + this post + this context, will the user engage (e.g., click or dwell >5 sec) — yes or no?" The model outputs a probability (0 to 1), and you rank posts by that probability.

### Features (the inputs to the model)

| Category | Example features |
|---|---|
| **User/persona** | persona's account age, total past interactions, number of topics followed |
| **Post** | post age (hours), upvote count, comment count, broad topic, narrow topic, post-length |
| **Topic match** | broad_topic_match (0/1); narrow_topic_match (0/1); persona's affinity_score for the post's broad topic; persona's affinity_score for the post's narrow topic |
| **Context** | time of day, day of week, device type |
| **Historical** | persona's past click-through-rate on this broad topic; average dwell time on this narrow topic |

Each of these becomes one column in a table where each row is "one (persona, post) pair that was actually shown," and the label is "did they engage or not":

```python
def build_feature_vector(persona, post, session_topic_scores, context):
    return {
        'broad_topic_match': 1.0 if has_topic(persona, post.broad_topic_id) else 0.0,
        'narrow_topic_match': 1.0 if has_topic(persona, post.narrow_topic_id) else 0.0,
        'broad_topic_affinity': get_affinity(persona, post.broad_topic_id),
        'narrow_topic_affinity': get_affinity(persona, post.narrow_topic_id),
        'session_topic_boost': (session_topic_scores or {}).get(post.narrow_topic_id, 0.0),
        'post_age_hours': (now() - post.created_at).total_seconds() / 3600,
        'post_upvotes': post.upvotes,
        'post_comments': post.comment_count,
        'persona_interaction_count': persona.interactions.count(),
        'hour_of_day': context['hour_of_day'],
        'is_same_broad_topic_as_recent': context['is_same_broad_topic_as_recent'],
    }
```

### Model choices

**Start with Logistic Regression.** It's the simplest classifier: it learns one weight per feature and combines them linearly, then squashes the result into a 0-1 probability. It's fast to train, easy to debug (you can literally look at the learned weight per feature and sanity-check it), and a great "does my pipeline even work" sanity test.

```python
from sklearn.linear_model import LogisticRegression

model = LogisticRegression()
model.fit(X_train, y_train)   # X = feature vectors, y = 1 (engaged) or 0 (didn't)
probability_of_engagement = model.predict_proba(X_new)[:, 1]
```

**Upgrade to Gradient Boosted Trees (XGBoost / LightGBM) once you have more data (thousands+ of interactions).** Unlike logistic regression, these can automatically learn *interactions* between features (e.g., "freshness matters more for the News topic specifically") without you manually engineering that. This is the industry-standard choice for ranking problems with tabular features like these.

```python
import xgboost as xgb

model = xgb.XGBClassifier(n_estimators=100, max_depth=4, learning_rate=0.1)
model.fit(X_train, y_train)
probability_of_engagement = model.predict_proba(X_new)[:, 1]
```

**Keep the ranking model simple.** Logistic Regression or Gradient Boosted Trees are enough to combine topic-match signals, freshness, and popularity well. There's no need for anything heavier at this stage — added model complexity adds cost without materially improving a well-designed topic-based pipeline.

### Training the model using interaction data

1. **Build a training table:** for every post that was actually *shown* to a persona (not just interacted with — you need negative examples too, i.e., posts shown but ignored), create one row: features + label (1 if clicked/liked/dwelled ≥ threshold, 0 otherwise).
2. **Split into train/test sets** (e.g., 80/20) so you can check the model isn't just memorizing.
3. **Train**, then evaluate using a metric like **AUC** (how well it ranks positives above negatives — 0.5 = random guessing, 1.0 = perfect).
4. **Retrain periodically** (e.g., nightly or weekly, via a scheduled job — Django's `django-crontab`, Celery beat, or a simple cron calling a management command) as new interaction data accumulates.
5. **Save the trained model** (`joblib.dump(model, 'ranking_model.pkl')`) and load it in your Django ranking service at request time — training happens **offline** (a batch job), scoring happens **online** (during a feed request), and these should never be conflated: never train a model live inside a web request.

---

## 6. Persona System

### The core design decision

Each persona is a **separate row** in the `personas` table, with its own topic follows (via `persona_topics`) and its own interaction history (via the `persona_id` foreign key on `interactions` — not `user_id`). This is the cleanest possible design: personas aren't a "mode flag" on the user, they're independent entities that happen to share a `user_id`.

```python
# personas/models.py
class Persona(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='personas')
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'name')


class PersonaTopic(models.Model):
    persona = models.ForeignKey(Persona, on_delete=models.CASCADE, related_name='topic_affinities')
    topic = models.ForeignKey('posts.Topic', on_delete=models.CASCADE)
    affinity_score = models.FloatField(default=1.0)

    class Meta:
        unique_together = ('persona', 'topic')
```

### Separate interaction histories

Because `interactions.persona_id` (not `user_id`) is the foreign key, querying "this persona's history" is naturally isolated:

```python
persona.interactions.all()  # only this persona's clicks/likes/dwells — never mixed with other personas
```

This single design choice (persona_id as the FK, not user_id) is what makes everything else — separate topic affinities, separate feeds, separate feedback loops — fall out naturally, rather than needing special-case logic scattered everywhere.

### How the feed changes when persona is switched

When the frontend calls `/api/personas/{id}/activate`, the backend just marks that persona as "currently active" (e.g., store `active_persona_id` in the session or JWT claims). Every subsequent `/api/feed/` and `/api/interact/` call includes/resolves this persona ID, and the entire pipeline (candidate generation → ranking) uses *that* persona's topic affinities and history — nothing else changes about the pipeline code. This is the payoff of designing personas as independent rows from day one: "switch persona" doesn't need special pipeline logic, it just changes *which row* the same pipeline reads.

```python
# feed/views.py (simplified)
class FeedView(APIView):
    def get(self, request):
        persona = request.user.personas.get(id=request.session['active_persona_id'])
        candidates = generate_candidates(persona)
        filtered = filter_candidates(candidates, persona)
        ranked = rank_candidates(filtered, persona)
        final_feed = rerank(ranked)
        return Response(final_feed)
```

---

## 7. Session Awareness

### What is session-level topic tracking?

A persona's `persona_topics.affinity_score` represents **long-term** taste — built up over weeks/months, changing slowly (small increments, Section 8). But your spec asks for something *more responsive*: if someone starts scrolling sad content *right now*, the feed should shift within the same session — without permanently overwriting the persona's long-term topic affinities.

The solution is a **second, separate structure**: **session topic scores** — a short-lived map of `{topic_id: weight}`, reset or decayed quickly, representing "what topics has this persona engaged with in the last few minutes."

### How to update it in real time

Keep it in a fast, ephemeral store — **Redis** is the standard choice (in-memory, extremely fast reads/writes, and naturally supports expiry).

```python
import redis
import json

r = redis.Redis()

def update_session_topics(persona_id, topic_id, weight=0.3):
    key = f"session_topics:{persona_id}"
    existing = json.loads(r.get(key) or "{}")
    # decay existing scores slightly, then boost the topic just engaged with
    decayed = {tid: score * 0.9 for tid, score in existing.items()}
    decayed[str(topic_id)] = decayed.get(str(topic_id), 0.0) + weight
    r.set(key, json.dumps(decayed), ex=1800)  # expires after 30 min of inactivity
    return decayed

def get_session_topics(persona_id):
    existing = r.get(f"session_topics:{persona_id}")
    return json.loads(existing) if existing else {}
```

Notice the `weight` here (`0.3`) is **much larger** than the small increments used for the persona's long-term `affinity_score` updates (Section 8) — session topic scores should react quickly, since they're meant to capture "right now," not "always."

The `ex=1800` (expire after 30 minutes) means an idle session naturally resets — the next time this persona interacts, it starts fresh from the long-term persona topic affinities rather than a stale session state.

### How it influences ranking

The session topic scores are blended into the score alongside the persona's long-term affinities — you already saw this in Section 5's scoring function (`0.7 * score + 0.3 * session_boost`). As the ML model matures (Section 5's ML upgrade), `session_topic_boost` simply becomes one more input feature, and the model learns how much to weight it — likely more heavily than a hand-picked `0.3`.

---

## 8. Feedback Loop

### Tracking user behavior

Every meaningful action becomes a row in `interactions` via the `/api/interact/` endpoint:

```python
# interactions/views.py
class InteractionView(APIView):
    def post(self, request):
        persona_id = request.data['persona_id']
        post_id = request.data['post_id']
        interaction_type = request.data['interaction_type']  # 'impression' | 'click' | 'like' | 'dwell' | 'skip' | 'comment'
        dwell_seconds = request.data.get('dwell_seconds')

        Interaction.objects.create(
            persona_id=persona_id,
            post_id=post_id,
            interaction_type=interaction_type,
            dwell_seconds=dwell_seconds,
        )

        post = Post.objects.get(id=post_id)

        # near-real-time updates (session topic scores always; persona topic affinity for strong signals)
        if interaction_type in ('like', 'comment', 'share') or (dwell_seconds or 0) > 5:
            update_session_topics(persona_id, post.narrow_topic_id)
            update_session_topics(persona_id, post.broad_topic_id, weight=0.15)  # broad topic gets a smaller nudge

        if interaction_type in ('like', 'comment', 'share'):
            update_persona_topic_affinity(persona_id, post.narrow_topic_id, delta=0.1)
            update_persona_topic_affinity(persona_id, post.broad_topic_id, delta=0.05)

        return Response(status=201)


def update_persona_topic_affinity(persona_id, topic_id, delta):
    """
    Nudges (or creates) a persona's affinity score for a topic.
    delta = how much this interaction should move the score
            (small delta = affinity changes slowly; big delta = changes fast)
    """
    pt, _ = PersonaTopic.objects.get_or_create(
        persona_id=persona_id, topic_id=topic_id, defaults={'affinity_score': 0.0}
    )
    pt.affinity_score = min(pt.affinity_score + delta, 5.0)  # simple cap, nothing fancier needed
    pt.save()
```

**Design note:** not every interaction should move affinity scores — a `skip` or a sub-1-second glance is *weak/negative* signal, not something you want nudging a persona's affinity toward that topic. Decide thresholds like this deliberately (e.g., "dwell < 2 sec on a long post = mild negative signal," "dwell > 10 sec = positive signal") rather than treating every logged row as equally meaningful.

### Converting it into training data

Periodically (e.g., a nightly job), build a training table by joining "what was shown" against "what happened":

```python
def build_training_row(persona_id, post_id, was_shown_at):
    interactions_after = Interaction.objects.filter(
        persona_id=persona_id, post_id=post_id, created_at__gte=was_shown_at
    )
    engaged = interactions_after.filter(
        Q(interaction_type__in=['like', 'comment', 'share']) | Q(dwell_seconds__gte=5)
    ).exists()
    label = 1 if engaged else 0
    features = build_feature_vector(persona_id, post_id, ...)  # from Section 5
    return {**features, 'label': label}
```

This is why you need to **log impressions** (which posts were actually shown, not just which were clicked) — without impressions, you only have positive examples and no negatives, and a model trained on positives-only can't learn to discriminate. Add a lightweight `impressions` table (or log to `interactions` with `interaction_type='impression'`) recording every post shown in a feed response.

### Updating topic affinities over time

There are two update rhythms, and it's important to keep them distinct:

| | Session topic scores | Persona topic affinity | Ranking model |
|---|---|---|---|
| **Update frequency** | Every relevant interaction, instantly | Every strong-signal interaction, instantly (small nudge) | Periodically (batch, e.g. nightly) |
| **Storage** | Redis (fast, ephemeral) | Postgres (`persona_topics.affinity_score`) | Saved model file (`.pkl`) |
| **Purpose** | Capture "right now" | Capture "this persona's taste, long-term" | Learn *how* to combine all signals well |

---

## 9. Step-by-Step Implementation Plan

Build in this order. Each step should be fully working (even if simplistic) before moving to the next — resist the urge to build the ranking model before you have a working feed loop, even a dumb one.

### Step 1 — Basic backend + database
- Django project, Postgres connection (no extensions needed — plain relational tables).
- Models: `User`, `Topic` (broad/narrow), `Post`, `Persona`, `PersonaTopic`, `Interaction`.
- Basic CRUD endpoints: create posts, list posts, create topics.
- React: basic pages (login/signup, a plain post list, no personalization yet).

### Step 2 — Simple feed (no ML at all)
- `/api/feed/` returns posts sorted by `created_at DESC` (reverse-chronological) or by a simple popularity score (`upvotes`), scoped to topics the user follows.
- This proves your API contract and frontend feed rendering work, decoupled from any ranking complexity.
- Build the `/api/interact/` endpoint now too — log clicks/likes even though nothing reads them yet. You want interaction history accumulating from day one.

### Step 3 — Add topic-based candidate filtering
- Build the `topics` table (broad + narrow) and tag existing/new posts with `broad_topic_id` and `narrow_topic_id`.
- Set up onboarding: persona selects topics (broad and/or narrow) → creates `persona_topics` rows with a flat initial `affinity_score`.
- Write and manually test the "broad-topic candidates, narrow-topic refined" query from Section 4 before wiring it into the feed.

### Step 4 — Add ranking (start with the hand-written scoring function)
- Wire candidate generation (broad-topic query from Step 3) → filtering (remove seen posts, apply narrow-topic refinement) → the `score_post()` formula from Section 5 → sort → return.
- At this point you have a genuinely personalized feed, with zero trained ML models yet. This is a meaningful, demoable milestone — don't rush past it.

### Step 5 — Add personas (multiple per user)
- Allow creating additional personas; each gets its own `persona_topics` rows, initialized from its own onboarding topic selections (or copy-and-diverge from an existing persona).
- Add the persona switcher UI; verify feeds genuinely differ between personas for the same user (this is your key acceptance test for this step).

### Step 6 — Add session awareness
- Set up Redis; implement `update_session_topics` / `get_session_topics`.
- Blend the session topic boost into the scoring formula.
- Test manually: interact heavily with one type of content in a single sitting and confirm the feed visibly shifts within that session, then verify it resets after the persona is idle (or in a new session).

### Step 7 — Feedback loop → real ML ranking model
- Add impression logging (what was actually shown).
- Build the training-data-generation job (Section 8).
- Train a Logistic Regression baseline; evaluate with AUC against a held-out set.
- Swap the hand-written `score_post()` for `model.predict_proba(features)` in the ranking stage — keep the formula version around (or behind a feature flag) so you can compare.
- Once you have enough data, upgrade to XGBoost/LightGBM.

### Step 8 — Re-ranking layer
- Add diversity rules (e.g., no more than 2 consecutive posts from the same broad topic).
- Add a small freshness boost and 1-2 guaranteed "exploration" slots per feed page.

### Step 9 (future, per your spec) — "Khichdi mode"
- A combined feed blending multiple personas' topic affinities with weights (e.g., a weighted average of `persona_topics` scores across personas, or simply interleaving each persona's top candidates). Deliberately deferred — build this only once individual personas work well, since it's a strict extension of the same candidate-generation + ranking pipeline (just fed multiple personas' affinities instead of one).

---

## Quick Glossary (for reference while building)

| Term | Plain-English meaning |
|---|---|
| **Broad topic** | A general content category (e.g., "programming", "fitness") — every post has exactly one |
| **Narrow topic** | A specific sub-category within a broad topic (e.g., "react" within "programming") — every post has exactly one |
| **Topic affinity score** | A per-persona, per-topic number representing how much that persona engages with that topic; starts flat at onboarding and is nudged by interactions |
| **Cold start** | The period before any interaction data exists, when the feed relies purely on onboarding-selected topics |
| **Candidate generation** | Cheaply narrowing thousands of posts down to a few hundred plausible ones (here: via broad-topic match) |
| **Collaborative filtering** | "People similar to you liked this" — recommending based on similar *personas*, not just similar *topics* |
| **Feature vector** | The set of numeric inputs (topic match, freshness, popularity, etc.) fed into an ML model |
| **Logistic regression** | A simple ML model that linearly combines features into a 0-1 probability |
| **Gradient boosted trees (XGBoost)** | A more powerful ML model that can learn feature *interactions* automatically |
| **AUC** | A metric (0.5-1.0) for how well a model ranks positive examples above negative ones |
| **Session topic scores** | A short-lived, per-persona map of topic → weight capturing "what this persona is engaging with right now" |
| **Impression** | A record that a post was *shown*, regardless of whether the user acted on it — needed for negative training examples |
| **Re-ranking** | Adjusting a scored/sorted list for diversity, freshness, or exploration — not the same as scoring |
