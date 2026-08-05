"""
ml/ranking_model/features.py

Builds the feature vector fed into the ranking model (Section 5). Each
call represents one (persona, post) pair that was shown to the user; the
returned dict becomes one row in the training table (label attached
separately by train.py).
"""

import numpy as np
from django.utils.timezone import now

from interactions.models import Interaction


def cosine_similarity(vec_a, vec_b):
    if vec_a is None or vec_b is None:
        return 0.0
    a, b = np.array(vec_a), np.array(vec_b)
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    if denom == 0:
        return 0.0
    return float(np.dot(a, b) / denom)


def persona_community_ctr(persona, community_id):
    """Persona's historical click-through-rate on this community."""
    community_interactions = Interaction.objects.filter(
        persona=persona, post__community_id=community_id
    )
    total = community_interactions.count()
    if total == 0:
        return 0.0
    engaged = community_interactions.filter(
        interaction_type__in=["click", "like", "comment", "share"]
    ).count()
    return engaged / total


def build_feature_vector(persona, post, session_embedding, context):
    """
    Returns a flat dict of numeric features for one (persona, post) pair.
    Keep keys stable and sorted-order-consistent — ranking.py relies on
    a deterministic ordering when feeding this into the trained model.
    """
    return {
        "content_similarity": cosine_similarity(persona.embedding, post.embedding),
        "session_similarity": cosine_similarity(session_embedding, post.embedding),
        "post_age_hours": (now() - post.created_at).total_seconds() / 3600,
        "post_upvotes": post.upvotes,
        "post_comments": post.comment_count,
        "persona_interaction_count": persona.interactions.count(),
        "persona_community_ctr": persona_community_ctr(persona, post.community_id),
        "hour_of_day": context.get("hour_of_day", now().hour),
        "is_same_community_as_recent": int(context.get("is_same_community_as_recent", False)),
    }
