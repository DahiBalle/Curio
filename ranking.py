"""
feed/services/ranking.py

Stage 3 of the feed pipeline (the actual "personalization" step): assigns
each filtered candidate a score representing "how likely is this persona,
in this session, to engage with this post" — then sorts by score.

Starts as a hand-written formula (Section 5). Once a trained model exists
(ml/ranking_model/train.py), flip USE_ML_MODEL to True to swap it in —
keep the formula path available behind the flag so you can compare.
"""

import numpy as np
from django.utils.timezone import now

from ml.session.session_state import get_session_embedding
from ml.ranking_model.features import build_feature_vector

USE_ML_MODEL = False
_MODEL = None


def cosine_similarity(vec_a, vec_b):
    a, b = np.array(vec_a), np.array(vec_b)
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


def score_post(post, persona, session_embedding=None):
    """
    Hand-written baseline scoring formula (no ML yet). A legitimate way to
    launch a feed — gives the pipeline a working end-to-end baseline that
    any future ML model needs to beat.
    """
    similarity = cosine_similarity(persona.embedding, post.embedding)

    # Freshness: newer posts score higher, decaying over ~2 days.
    hours_old = (now() - post.created_at).total_seconds() / 3600
    freshness = 1 / (1 + hours_old / 48)

    # Popularity: log-scaled so viral posts don't totally dominate.
    popularity = np.log1p(post.upvotes)

    score = (0.6 * similarity) + (0.2 * freshness) + (0.2 * popularity / 10)

    if session_embedding is not None:
        session_sim = cosine_similarity(session_embedding, post.embedding)
        score = 0.7 * score + 0.3 * session_sim  # blend in short-term intent

    return score


def _load_model():
    global _MODEL
    if _MODEL is None:
        import joblib
        import os

        model_path = os.path.join(os.path.dirname(__file__), "..", "..", "ml", "ranking_model", "model.pkl")
        _MODEL = joblib.load(model_path)
    return _MODEL


def _score_with_model(post, persona, session_embedding, context):
    model = _load_model()
    features = build_feature_vector(persona, post, session_embedding, context)
    ordered_values = [[features[k] for k in sorted(features)]]
    return float(model.predict_proba(ordered_values)[:, 1][0])


def rank_candidates(candidates, persona, context=None):
    """
    Scores every filtered candidate and returns them sorted best-first.
    """
    context = context or {}
    session_embedding = get_session_embedding(persona.id)

    scored = []
    for post in candidates:
        if USE_ML_MODEL:
            score = _score_with_model(post, persona, session_embedding, context)
        else:
            score = score_post(post, persona, session_embedding)
        scored.append((post, score))

    scored.sort(key=lambda pair: pair[1], reverse=True)
    return scored
