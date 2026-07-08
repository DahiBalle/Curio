
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

Why split it into stages instead of "just score everything"? Because **scoring is expensive** (especially once ML is involved), and you have millions of posts but only need ~20-30. You don't want to run an expensive ranking model on every post in the database — you want to cheaply narrow down to a few hundred good *candidates* first, and only spend the expensive computation on those.

### Stage 1: Candidate Generation

**What it does:** Quickly pulls a rough pool of "posts that *might* be relevant" from millions of posts, using cheap methods.

**Why it's needed:** You can't rank a million posts in real time. You need a fast way to go from "everything" to "a few hundred plausible options."

**How, concretely:** You pull candidates from multiple independent sources (this is what your spec calls "Feed Sources"), then combine them:

- **Content similarity** — "posts similar to what this persona has liked before" (via embeddings, explained in Section 4). Implemented as a nearest-neighbor vector search.
- **Collaborative filtering** — "posts liked by other users who behave like this one." Simple version: "users who liked what you liked, also liked this."
- **Trending/hot posts** — posts with high recent engagement velocity (likes/comments per hour), independent of personalization. This ensures new/viral content gets a chance even without a match history.
- **Community/sub.-based** — posts from communities the user follows.
- **Exploration** — a small random sample of posts *outside* the user's usual pattern, deliberately injected. This prevents "filter bubble" stagnation and lets the system discover new interests.

You typically pull ~100-200 candidates from each source, then merge and de-duplicate → ends up around 500-1000 total candidates.

### Stage 2: Filtering

**What it does:** Removes candidates that should never be shown, regardless of relevance score.

**Why it's needed:** Ranking is about "which is best," but filtering is about "which are even eligible." Mixing these up is a common beginner mistake — don't let your ranking model try to learn "don't show already-seen posts"; just filter those out directly, it's more reliable and much cheaper.

**Typical filters:**
- Already seen/interacted with (unless you deliberately want repeats)
- Blocked users/communities
- NSFW mismatch with user settings
- Removed/deleted/reported posts
- Age limits (e.g., older than 30 days, unless it's evergreen content)

### Stage 3: Ranking (the ML part)

**What it does:** Takes the filtered candidates (a few hundred) and assigns each a score representing "how likely is this specific persona, in this specific session, to engage with this post." Then sorts by score.

**Why it's needed:** This is the actual "personalization" step. Candidate generation asks "roughly relevant?" Ranking asks "precisely, how relevant, right now, for engagement?"

Early on, this is just a formula (Section 5 covers this in detail: "start with a scoring function, no ML yet"). Later, it becomes a trained model (logistic regression → gradient boosting, etc.).

### Stage 4: Re-ranking

**What it does:** Takes the ranked list and adjusts it — not because the ranking was wrong, but because a **naive top-N by score** creates bad feed experiences:

- **Diversity** — if the top 10 posts are all from the same community or all about the same topic, force some variety in.
- **Freshness** — boost recent posts a bit so the feed doesn't feel stale, even if an older post scored slightly higher.
- **Exploration slots** — reserve a couple of feed positions for "different from the user's norm" content, regardless of score, to keep gathering signal on other interests.

**Why it's a separate stage from ranking:** Ranking answers "how relevant is this post in isolation," but re-ranking answers "what's the best *set* of posts to put together." These are genuinely different problems (this is sometimes called "slate optimization" if you want to look it up later — not needed now).

### Stage 5: Feed Delivery

**What it does:** Packages the final ~20-30 posts and sends them to the frontend via the API, typically paginated (e.g., 10-20 at a time as the user scrolls).

### Stage 6: Feedback Loop

**What it does:** Every click, like, comment, share, skip, and dwell-time-on-post is logged as an **interaction**. This data does two things:
1. **Updates embeddings quickly** (session-level, lightweight, near-real-time) — covered in Section 7.
2. **Accumulates as training data** for periodically retraining the ranking model — covered in Section 8.

This closes the loop: today's interactions shape tomorrow's (and even the next scroll's) feed.

---

## 2. Project Structure

### High-level layout

```
.-clone/
├── frontend/                  # React app
├── backend/                   # Django project
│   ├── manage.py
│   ├── config/                # Django settings, urls, wsgi/asgi
│   ├── accounts/               # User auth app
│   ├── personas/                # Persona model + logic
│   ├── posts/                   # Post + Community models
│   ├── interactions/            # Interaction tracking
│   ├── feed/                    # Feed generation orchestration
│   └── ml/                      # ML code lives HERE (see below)
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
│   │   │   └── InterestPicker.jsx     # Pinterest-style interest selection
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

**Key idea for the persona switcher:** the active persona ID should live in global state (Context, or Redux/Zustand if you prefer) and get sent with every `/feed` and `/interact` API call — this is what tells the backend *which* persona's embedding/history to use.

**Dwell time tracking**, in simple terms: when a post scrolls into view, start a timer (`performance.now()`); when it scrolls out of view (via `IntersectionObserver`), compute the elapsed time and send it as part of the interaction event. Don't send this on every frame — batch it (e.g., send when the post leaves the viewport, or every N seconds).

### Backend (Django) structure

```
backend/
├── accounts/
│   ├── models.py        # User (extend Django's AbstractUser if needed)
│   ├── serializers.py
│   ├── views.py          # signup, login, onboarding interests
│   └── urls.py
├── personas/
│   ├── models.py        # Persona model
│   ├── serializers.py
│   ├── views.py          # CRUD for personas, switch active persona
│   └── urls.py
├── posts/
│   ├── models.py        # Post, Community models
│   ├── serializers.py
│   ├── views.py
│   └── urls.py
├── interactions/
│   ├── models.py        # Interaction model (click/like/dwell/etc.)
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
    ├── embeddings/
    │   ├── post_embedder.py     # turns post text into a vector
    │   └── persona_embedder.py  # updates persona/session vectors
    ├── ranking_model/
    │   ├── features.py           # builds feature vectors for ranking
    │   ├── train.py               # offline training script
    │   └── model.pkl              # saved trained model (or loaded from storage)
    └── session/
        └── session_state.py      # in-memory / Redis session embedding logic
```

**Why apps are split this way:** Django's convention is one "app" per bounded concept. `feed` isn't a database model — it's an *orchestrator* that calls into `posts`, `personas`, `interactions`, and `ml` to assemble a response. Keeping ML code in its own `ml/` module (not scattered inside `feed/views.py`) means you can test, retrain, and even later extract it into a separate service without rewriting your views.

### Where does ML code live, and does it need a separate service?

**Beginner answer: no, not at first.** Put ML code as plain Python modules inside your Django project (the `ml/` app above), imported and called directly by `feed/views.py`. This keeps everything in one deployable unit and avoids network calls, serialization overhead, and "two things to deploy" complexity while you're learning and iterating.

**When to split into a separate service later:** if your ML models become heavy (e.g., large deep learning models needing a GPU), or you want independent scaling (many web requests, but ranking is the bottleneck), or a different team/language owns ML — then you'd extract `ml/` into a standalone Python service (e.g., FastAPI) that Django calls over HTTP or gRPC. This is a "when you actually hit the limit" decision, not a day-1 decision. Building it as an internal module first, with clean function boundaries, makes this extraction easy later — you're mainly swapping a Python function call for an HTTP call.

### API endpoints (initial set)

| Endpoint | Method | Purpose |
|---|---|---|
| `/api/auth/signup` | POST | Create account |
| `/api/auth/login` | POST | Login, return token |
| `/api/onboarding/interests` | POST | Save selected interests → seeds first persona |
| `/api/personas/` | GET, POST | List / create personas |
| `/api/personas/{id}/activate` | POST | Set active persona for the session |
| `/api/communities/` | GET | List communities/sub.s |
| `/api/feed/` | GET | Returns ranked feed for active persona (paginated) |
| `/api/interact/` | POST | Log an interaction (click/like/dwell/skip/comment) |
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

-- Communities (sub.s)
CREATE TABLE communities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT now()
);

-- Personas (belongs to a user)
CREATE TABLE personas (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,           -- e.g. "Gamer", "Mellow"
    embedding VECTOR(384),                 -- persona's long-term interest vector
    created_at TIMESTAMP DEFAULT now(),
    UNIQUE(user_id, name)
);

-- Posts
CREATE TABLE posts (
    id SERIAL PRIMARY KEY,
    community_id INTEGER REFERENCES communities(id),
    author_id INTEGER REFERENCES users(id),
    title VARCHAR(300) NOT NULL,
    body TEXT,
    embedding VECTOR(384),                 -- content embedding
    upvotes INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT now()
);

-- Interactions (the feedback loop's raw data)
CREATE TABLE interactions (
    id BIGSERIAL PRIMARY KEY,
    persona_id INTEGER REFERENCES personas(id) ON DELETE CASCADE,
    post_id INTEGER REFERENCES posts(id) ON DELETE CASCADE,
    interaction_type VARCHAR(20) NOT NULL,  -- 'click','like','dwell','skip','comment','share'
    dwell_seconds FLOAT,                     -- only relevant for 'dwell'
    created_at TIMESTAMP DEFAULT now()
);

-- User interests from onboarding (many-to-many)
CREATE TABLE interests (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL
);

CREATE TABLE persona_interests (
    persona_id INTEGER REFERENCES personas(id) ON DELETE CASCADE,
    interest_id INTEGER REFERENCES interests(id) ON DELETE CASCADE,
    PRIMARY KEY (persona_id, interest_id)
);
```

### Storing embeddings: use `pgvector`

**What it is, in plain terms:** an embedding is just a list of numbers (e.g., 384 numbers) that represents "meaning" as a point in space (fully explained in Section 4). `pgvector` is a PostgreSQL extension that adds a native `VECTOR` column type and fast similarity search — so instead of pulling every post into Python and computing similarity by hand, you ask Postgres directly: "give me the 20 posts whose embedding is closest to this one."

**Why use it instead of a separate vector database (like Pinecone/Weaviate)?** For a project of this size, adding a whole separate database is unnecessary complexity. `pgvector` lets you keep one database, one set of migrations, one backup strategy — and it's genuinely fast enough for hundreds of thousands to low millions of rows. Only consider a dedicated vector DB if you outgrow Postgres performance-wise (a "later" problem, not a "day 1" problem).

**Setup:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```
Then a column like `embedding VECTOR(384)` (384 is just an example dimension — it depends on which embedding model you use, see Section 4).

### Indexing strategy

For similarity search to be fast, add an **approximate nearest neighbor (ANN) index** on embedding columns:

```sql
CREATE INDEX ON posts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

- `ivfflat` is one of pgvector's index types — it clusters vectors into buckets ("lists") so a similarity search only has to look inside a few relevant buckets instead of scanning everything.
- `vector_cosine_ops` tells it to optimize for **cosine similarity** (explained in Section 4) — the standard metric for comparing embeddings.
- `lists = 100` is a tuning parameter; a common rule of thumb is `rows / 1000`, so 100 is fine up to ~100k posts — you can increase it as your table grows.

Other indexes you'll want regardless of ML:
```sql
CREATE INDEX idx_interactions_persona ON interactions(persona_id, created_at DESC);
CREATE INDEX idx_posts_community_created ON posts(community_id, created_at DESC);
CREATE INDEX idx_posts_created ON posts(created_at DESC);  -- for "trending/recent" queries
```

---

## 4. Embeddings (Core ML Concept)

### What is an embedding, in simple terms?

Imagine you had to describe a movie using only three numbers: how funny it is (0-10), how violent it is (0-10), and how romantic it is (0-10). "The Notebook" might be `[1, 0, 9]`. "John Wick" might be `[2, 9, 0]`. Now, two movies with *similar* numbers are probably similar in *feel* — even though you never told the computer what "similar" means; it falls out of comparing the numbers.

An **embedding** is exactly this idea, scaled up: instead of 3 hand-picked numbers, it's typically 300-1000+ numbers, and instead of a human choosing what each number means, a machine learning model learns which numbers best capture "meaning" from huge amounts of text. You don't get to interpret individual numbers (e.g., "number #47 = violence") — but the *overall pattern* captures meaning well enough that similar content ends up with similar vectors.

So: **an embedding is just a list of numbers representing a piece of content (or a person's taste) as a point in space, such that similar things end up close together in that space.**

### Generating embeddings for posts

You don't need to train your own embedding model — use a **pretrained model** (one already trained by someone else on huge datasets) and just run your text through it.

**Recommended for a beginner:** [`sentence-transformers`](https://www.sbert.net/), specifically a model like `all-MiniLM-L6-v2` — it's small, fast, runs fine on CPU, and outputs 384-dimensional vectors (this is why the SQL above used `VECTOR(384)`).

```python
from sentence_transformers import SentenceTransformer

model = SentenceTransformer('all-MiniLM-L6-v2')

def embed_post(title: str, body: str) -> list[float]:
    text = f"{title}. {body or ''}"
    vector = model.encode(text)
    return vector.tolist()  # store this in the post's `embedding` column
```

You run this once when a post is created (e.g., in a Django `post_save` signal or in the create view), and store the resulting vector in the `embedding` column.

### Generating embeddings for a persona

A persona doesn't have "text" of its own — its embedding is built from **what it has interacted with**. The simplest, very effective approach:

**Persona embedding = weighted average of the embeddings of posts it engaged with positively.**

```python
import numpy as np

def update_persona_embedding(persona, new_post_embedding, weight=0.1):
    """
    Nudges the persona's embedding toward a post it just engaged with.
    weight = how much this single interaction should move the average
             (small weight = persona changes slowly; big weight = changes fast)
    """
    old = np.array(persona.embedding) if persona.embedding else np.zeros(384)
    new_post_vec = np.array(new_post_embedding)
    updated = (1 - weight) * old + weight * new_post_vec
    persona.embedding = updated.tolist()
    persona.save()
```

This is called an **exponential moving average** — every new interaction pulls the persona's vector a little bit toward that content, without throwing away everything it learned before. At onboarding (before any interactions exist), initialize the persona's embedding as the average embedding of posts matching their selected interests.

### Cosine similarity, explained simply

Once everything is a vector, you need a way to ask "how similar are these two vectors?" **Cosine similarity** measures the *angle* between two vectors, ignoring their length/magnitude — it answers "do these two things point in the same direction?" rather than "are these two things the same size?"

- Result is always between **-1 and 1** (with normalized embeddings, usually between 0 and 1).
- **1** = pointing in exactly the same direction (very similar)
- **0** = unrelated / perpendicular
- **-1** = pointing in opposite directions (very dissimilar)

```python
import numpy as np

def cosine_similarity(vec_a, vec_b):
    a, b = np.array(vec_a), np.array(vec_b)
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))
```

**Why "angle" instead of "distance"?** Two long documents about the same topic might have "bigger" vectors than two short ones, but they can still point in the same direction (same *meaning*). Cosine similarity cares about direction (topic/meaning), not magnitude (length/intensity) — which is exactly what you want when comparing "is this post about the same stuff this persona likes," regardless of how long the post or how much interaction history exists.

### How similarity powers feed generation

This is the core mechanism behind the "content similarity" candidate source from Section 1:

1. Take the persona's current embedding (or session embedding — see Section 7).
2. Ask the database: "give me the N posts with the highest cosine similarity to this vector" (this is exactly what the `pgvector` index from Section 3 makes fast):

```sql
SELECT id, title, 1 - (embedding <=> :persona_vector) AS similarity
FROM posts
ORDER BY embedding <=> :persona_vector   -- <=> is pgvector's cosine distance operator
LIMIT 100;
```

(Note: pgvector's `<=>` operator returns cosine *distance*, so `1 - distance` = similarity.)

3. Those 100 posts become your "content similarity" candidates for Stage 1 (Candidate Generation).

---

## 5. Ranking Model (the ML part)

### Start simple: a scoring function, no ML yet

Before training any model, build a **hand-written formula** that combines a few signals into one score. This gets your whole pipeline working end-to-end, and gives you a baseline to compare future ML models against (if your fancy model can't beat this, something's wrong).

```python
def score_post(post, persona, session_embedding=None):
    similarity = cosine_similarity(persona.embedding, post.embedding)

    # freshness: newer posts score higher, decaying over ~2 days
    hours_old = (now() - post.created_at).total_seconds() / 3600
    freshness = 1 / (1 + hours_old / 48)

    # popularity: log-scaled so viral posts don't totally dominate
    popularity = np.log1p(post.upvotes)

    score = (0.6 * similarity) + (0.2 * freshness) + (0.2 * popularity / 10)

    if session_embedding is not None:
        session_sim = cosine_similarity(session_embedding, post.embedding)
        score = 0.7 * score + 0.3 * session_sim   # blend in short-term intent

    return score
```

The weights (`0.6`, `0.2`, `0.2`, etc.) are guesses at first — that's fine. This is a completely legitimate way to launch a feed; ., YouTube, and virtually every recommendation system started with hand-tuned scoring formulas before ML entered the picture.

### Upgrading to a real ML model

**Why upgrade at all?** A hand-written formula has fixed weights you guessed. An ML model *learns* the best way to combine (many more) signals from actual interaction data — including signals that interact in non-obvious ways (e.g., "freshness matters a lot for News-type posts but barely at all for Meme-type posts").

**The framing:** ranking becomes a **binary classification problem** — "given this persona + this post + this context, will the user engage (e.g., click or dwell >5 sec) — yes or no?" The model outputs a probability (0 to 1), and you rank posts by that probability.

### Features (the inputs to the model)

| Category | Example features |
|---|---|
| **User/persona** | persona's account age, total past interactions, top-3 interest categories |
| **Post** | post age (hours), upvote count, comment count, community, post-length |
| **Similarity** | cosine similarity(persona embedding, post embedding); cosine similarity(session embedding, post embedding) |
| **Context** | time of day, day of week, device type |
| **Historical** | persona's past click-through-rate on this community; average dwell time on similar posts |

Each of these becomes one column in a table where each row is "one (persona, post) pair that was actually shown," and the label is "did they engage or not":

```python
def build_feature_vector(persona, post, session_embedding, context):
    return {
        'content_similarity': cosine_similarity(persona.embedding, post.embedding),
        'session_similarity': cosine_similarity(session_embedding, post.embedding) if session_embedding is not None else 0.0,
        'post_age_hours': (now() - post.created_at).total_seconds() / 3600,
        'post_upvotes': post.upvotes,
        'post_comments': post.comment_count,
        'persona_interaction_count': persona.interactions.count(),
        'hour_of_day': context['hour_of_day'],
        'is_same_community_as_recent': context['is_same_community_as_recent'],
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

**Upgrade to Gradient Boosted Trees (XGBoost / LightGBM) once you have more data (thousands+ of interactions).** Unlike logistic regression, these can automatically learn *interactions* between features (e.g., "freshness matters more for the News community specifically") without you manually engineering that. This is the industry-standard choice for ranking problems with tabular features like these.

```python
import xgboost as xgb

model = xgb.XGBClassifier(n_estimators=100, max_depth=4, learning_rate=0.1)
model.fit(X_train, y_train)
probability_of_engagement = model.predict_proba(X_new)[:, 1]
```

**Don't jump to deep learning / neural ranking models yet.** They need far more data and infrastructure to outperform gradient boosting on this kind of tabular, feature-based problem. That's a "if you outgrow this" step, likely well beyond your first several iterations.

### Training the model using interaction data

1. **Build a training table:** for every post that was actually *shown* to a persona (not just interacted with — you need negative examples too, i.e., posts shown but ignored), create one row: features + label (1 if clicked/liked/dwelled ≥ threshold, 0 otherwise).
2. **Split into train/test sets** (e.g., 80/20) so you can check the model isn't just memorizing.
3. **Train**, then evaluate using a metric like **AUC** (how well it ranks positives above negatives — 0.5 = random guessing, 1.0 = perfect).
4. **Retrain periodically** (e.g., nightly or weekly, via a scheduled job — Django's `django-crontab`, Celery beat, or a simple cron calling a management command) as new interaction data accumulates.
5. **Save the trained model** (`joblib.dump(model, 'ranking_model.pkl')`) and load it in your Django ranking service at request time — training happens **offline** (a batch job), scoring happens **online** (during a feed request), and these should never be conflated: never train a model live inside a web request.

---

## 6. Persona System

### The core design decision

Each persona is a **separate row** in the `personas` table, each with its own `embedding` column and its own interaction history (via the `persona_id` foreign key on `interactions` — not `user_id`). This is the cleanest possible design: personas aren't a "mode flag" on the user, they're independent entities that happen to share a `user_id`.

```python
# personas/models.py
class Persona(models.Model):
    user = models.ForeignKey('accounts.User', on_delete=models.CASCADE, related_name='personas')
    name = models.CharField(max_length=100)
    embedding = VectorField(dimensions=384, null=True)  # via pgvector-django or django-pgvector
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'name')
```

### Separate interaction histories

Because `interactions.persona_id` (not `user_id`) is the foreign key, querying "this persona's history" is naturally isolated:

```python
persona.interactions.all()  # only this persona's clicks/likes/dwells — never mixed with other personas
```

This single design choice (persona_id as the FK, not user_id) is what makes everything else — separate embeddings, separate feeds, separate feedback loops — fall out naturally, rather than needing special-case logic scattered everywhere.

### How the feed changes when persona is switched

When the frontend calls `/api/personas/{id}/activate`, the backend just marks that persona as "currently active" (e.g., store `active_persona_id` in the session or JWT claims). Every subsequent `/api/feed/` and `/api/interact/` call includes/resolves this persona ID, and the entire pipeline (candidate generation → ranking) uses *that* persona's embedding and history — nothing else changes about the pipeline code. This is the payoff of designing personas as independent rows from day one: "switch persona" doesn't need special pipeline logic, it just changes *which row* the same pipeline reads.

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

### What is a session embedding?

Your persona's main `embedding` represents **long-term** taste — built up over weeks/months, changing slowly (small `weight` in the exponential moving average from Section 4). But your spec asks for something *more responsive*: if someone starts scrolling sad content *right now*, the feed should shift within the same session — without permanently overwriting the persona's long-term profile.

The solution is a **second, separate vector**: the **session embedding** — short-lived (reset each new session, or decayed quickly), representing "what has this persona engaged with in the last few minutes."

### How to update it in real time

Keep it in a fast, ephemeral store — **Redis** is the standard choice (in-memory, extremely fast reads/writes, and naturally supports expiry).

```python
import redis
import numpy as np
import json

r = redis.Redis()

def update_session_embedding(persona_id, post_embedding, weight=0.3):
    key = f"session_emb:{persona_id}"
    existing = r.get(key)
    old_vec = np.array(json.loads(existing)) if existing else np.zeros(384)
    new_vec = (1 - weight) * old_vec + weight * np.array(post_embedding)
    r.set(key, json.dumps(new_vec.tolist()), ex=1800)  # expires after 30 min of inactivity
    return new_vec

def get_session_embedding(persona_id):
    existing = r.get(f"session_emb:{persona_id}")
    return np.array(json.loads(existing)) if existing else None
```

Notice the `weight` here (`0.3`) is **much larger** than the persona's long-term embedding weight (`0.1` in Section 4's example) — session embeddings should react quickly, since they're meant to capture "right now," not "always."

The `ex=1800` (expire after 30 minutes) means an idle session naturally resets — the next time this persona interacts, it starts fresh from the long-term persona embedding rather than a stale session vector.

### How it influences ranking

The session embedding is blended into the score alongside the persona's long-term embedding — you already saw this in Section 5's scoring function (`0.7 * score + 0.3 * session_sim`). As the ML model matures (Section 5's ML upgrade), `session_similarity` simply becomes one more input feature, and the model learns how much to weight it — likely more heavily than a hand-picked `0.3`.

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
        interaction_type = request.data['interaction_type']  # 'click' | 'like' | 'dwell' | 'skip' | 'comment'
        dwell_seconds = request.data.get('dwell_seconds')

        Interaction.objects.create(
            persona_id=persona_id,
            post_id=post_id,
            interaction_type=interaction_type,
            dwell_seconds=dwell_seconds,
        )

        # near-real-time updates (session embedding always; persona embedding for strong signals)
        post = Post.objects.get(id=post_id)
        if interaction_type in ('like', 'comment', 'share') or (dwell_seconds or 0) > 5:
            update_session_embedding(persona_id, post.embedding)
        if interaction_type in ('like', 'comment', 'share'):
            persona = Persona.objects.get(id=persona_id)
            update_persona_embedding(persona, post.embedding)

        return Response(status=201)
```

**Design note:** not every interaction should move the embeddings — a `skip` or a sub-1-second glance is *weak/negative* signal, not something you want nudging the persona toward that content. Decide thresholds like this deliberately (e.g., "dwell < 2 sec on a long post = mild negative signal," "dwell > 10 sec = positive signal") rather than treating every logged row as equally meaningful.

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

### Updating embeddings over time

There are two update rhythms, and it's important to keep them distinct:

| | Session embedding | Persona embedding | Ranking model |
|---|---|---|---|
| **Update frequency** | Every relevant interaction, instantly | Every strong-signal interaction, instantly (small nudge) | Periodically (batch, e.g. nightly) |
| **Storage** | Redis (fast, ephemeral) | Postgres (`personas.embedding`) | Saved model file (`.pkl`) |
| **Purpose** | Capture "right now" | Capture "this persona's taste, long-term" | Learn *how* to combine all signals well |

---

## 9. Step-by-Step Implementation Plan

Build in this order. Each step should be fully working (even if simplistic) before moving to the next — resist the urge to build embeddings before you have a working feed loop, even a dumb one.

### Step 1 — Basic backend + database
- Django project, Postgres connection, `pgvector` extension enabled.
- Models: `User`, `Community`, `Post`, `Persona` (embedding column can exist but stay unused for now), `Interaction`.
- Basic CRUD endpoints: create posts, list posts, create communities.
- React: basic pages (login/signup, a plain post list, no personalization yet).

### Step 2 — Simple feed (no ML at all)
- `/api/feed/` returns posts sorted by `created_at DESC` (reverse-chronological) or by a simple popularity score (`upvotes`), scoped to communities the user follows.
- This proves your API contract and frontend feed rendering work, decoupled from any ML complexity.
- Build the `/api/interact/` endpoint now too — log clicks/likes even though nothing reads them yet. You want interaction history accumulating from day one.

### Step 3 — Add embeddings
- Install `sentence-transformers`, generate embeddings for existing posts (a one-off backfill script), and auto-generate for new posts (on save).
- Set up onboarding: user picks interests → create their first persona → initialize persona embedding as the average embedding of posts matching those interests.
- Add the `pgvector` index; write the "N most similar posts to this persona" query and confirm it returns sensible results manually before wiring it into the feed.

### Step 4 — Add ranking (start with the hand-written scoring function)
- Wire candidate generation (content-similarity query) → filtering (remove seen posts) → the `score_post()` formula from Section 5 → sort → return.
- At this point you have a genuinely personalized feed, with zero trained ML models yet. This is a meaningful, demoable milestone — don't rush past it.

### Step 5 — Add personas (multiple per user)
- Allow creating additional personas; each gets its own embedding, initialized from its own onboarding interests (or copy-and-diverge from an existing persona).
- Add the persona switcher UI; verify feeds genuinely differ between personas for the same user (this is your key acceptance test for this step).

### Step 6 — Add session awareness
- Set up Redis; implement `update_session_embedding` / `get_session_embedding`.
- Blend session similarity into the scoring formula.
- Test manually: interact heavily with one type of content in a single sitting and confirm the feed visibly shifts within that session, then verify it resets after the persona is idle (or in a new session).

### Step 7 — Feedback loop → real ML ranking model
- Add impression logging (what was actually shown).
- Build the training-data-generation job (Section 8).
- Train a Logistic Regression baseline; evaluate with AUC against a held-out set.
- Swap the hand-written `score_post()` for `model.predict_proba(features)` in the ranking stage — keep the formula version around (or behind a feature flag) so you can compare.
- Once you have enough data, upgrade to XGBoost/LightGBM.

### Step 8 — Re-ranking layer
- Add diversity rules (e.g., no more than 2 consecutive posts from the same community).
- Add a small freshness boost and 1-2 guaranteed "exploration" slots per feed page.

### Step 9 (future, per your spec) — "Khichdi mode"
- A combined feed blending multiple personas' embeddings with weights (e.g., weighted average, or simply interleaving each persona's top candidates). Deliberately deferred — build this only once individual personas work well, since it's a strict extension of the same candidate-generation + ranking pipeline (just fed multiple embeddings instead of one).

---

## Quick Glossary (for reference while building)

| Term | Plain-English meaning |
|---|---|
| **Embedding** | A list of numbers representing meaning/taste as a point in space; similar things → nearby points |
| **Cosine similarity** | A score (-1 to 1) for "do these two vectors point the same direction" — used to compare embeddings |
| **Candidate generation** | Cheaply narrowing millions of posts down to a few hundred plausible ones |
| **Collaborative filtering** | "People similar to you liked this" — recommending based on similar *users*, not just similar *content* |
| **pgvector** | A Postgres extension adding a vector column type + fast similarity search |
| **ANN index (e.g. ivfflat)** | A data structure that makes similarity search fast by not comparing against every single row |
| **Feature vector** | The set of numeric inputs (similarity, freshness, popularity, etc.) fed into an ML model |
| **Logistic regression** | A simple ML model that linearly combines features into a 0-1 probability |
| **Gradient boosted trees (XGBoost)** | A more powerful ML model that can learn feature *interactions* automatically |
| **AUC** | A metric (0.5-1.0) for how well a model ranks positive examples above negative ones |
| **Exponential moving average** | A way to update a running value (like an embedding) by blending old + new, weighted |
| **Session embedding** | A short-lived vector capturing "what this persona is engaging with right now" |
| **Impression** | A record that a post was *shown*, regardless of whether the user acted on it — needed for negative training examples |
| **Re-ranking** | Adjusting a scored/sorted list for diversity, freshness, or exploration — not the same as scoring |
