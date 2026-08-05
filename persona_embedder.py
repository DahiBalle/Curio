"""
ml/embeddings/persona_embedder.py

Builds and maintains a persona's long-term taste embedding.

A persona has no "text" of its own — its embedding is derived from what
it has interacted with. It's initialized from onboarding interests, then
nudged over time via an exponential moving average as the persona engages
with content (Section 4 / Section 8).
"""

import numpy as np

from ml.embeddings.post_embedder import EMBEDDING_DIM

DEFAULT_UPDATE_WEIGHT = 0.1  # small = persona changes slowly


def initialize_persona_embedding(persona, matching_posts):
    """
    Called once at onboarding, before any interactions exist. Sets the
    persona's starting embedding to the average embedding of posts that
    match the user's selected interests.
    """
    if not matching_posts:
        persona.embedding = np.zeros(EMBEDDING_DIM).tolist()
        persona.save()
        return persona.embedding

    vectors = np.array([p.embedding for p in matching_posts])
    average = vectors.mean(axis=0)
    persona.embedding = average.tolist()
    persona.save()
    return persona.embedding


def update_persona_embedding(persona, new_post_embedding, weight=DEFAULT_UPDATE_WEIGHT):
    """
    Nudges the persona's long-term embedding toward a post it just engaged
    with positively (like/comment/share). This is an exponential moving
    average: each interaction pulls the vector a little toward that
    content, without discarding everything learned before.

    weight: how much a single interaction should move the average.
            Small weight = persona changes slowly; big weight = changes fast.
    """
    old = np.array(persona.embedding) if persona.embedding else np.zeros(EMBEDDING_DIM)
    new_post_vec = np.array(new_post_embedding)
    updated = (1 - weight) * old + weight * new_post_vec
    persona.embedding = updated.tolist()
    persona.save()
    return persona.embedding
