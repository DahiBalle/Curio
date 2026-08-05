"""
ml/session/session_state.py

Section 7: short-lived session embedding logic, kept in Redis (fast,
ephemeral, natural expiry support). Captures "what has this persona
engaged with in the last few minutes" — separate from the persona's
long-term embedding, which changes slowly.
"""

import json

import numpy as np
import redis

from ml.embeddings.post_embedder import EMBEDDING_DIM

SESSION_UPDATE_WEIGHT = 0.3  # much larger than the persona long-term weight (0.1) — react quickly
SESSION_TTL_SECONDS = 1800  # 30 min of inactivity resets the session

r = redis.Redis()


def _session_key(persona_id):
    return f"session_emb:{persona_id}"


def update_session_embedding(persona_id, post_embedding, weight=SESSION_UPDATE_WEIGHT):
    """
    Nudges the persona's session embedding toward a post it just engaged
    with. Called on strong-signal interactions (like/comment/share, or
    dwell time above threshold) — not every logged interaction.
    """
    key = _session_key(persona_id)
    existing = r.get(key)
    old_vec = np.array(json.loads(existing)) if existing else np.zeros(EMBEDDING_DIM)
    new_vec = (1 - weight) * old_vec + weight * np.array(post_embedding)
    r.set(key, json.dumps(new_vec.tolist()), ex=SESSION_TTL_SECONDS)
    return new_vec


def get_session_embedding(persona_id):
    """
    Returns the current session embedding as a numpy array, or None if the
    session has expired / never started (e.g. idle >30 min, or brand new
    persona with no interactions yet this session).
    """
    existing = r.get(_session_key(persona_id))
    return np.array(json.loads(existing)) if existing else None


def clear_session_embedding(persona_id):
    """Explicitly resets a persona's session (e.g. on logout or persona switch)."""
    r.delete(_session_key(persona_id))
