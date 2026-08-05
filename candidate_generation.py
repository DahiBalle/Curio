"""
feed/services/candidate_generation.py

Stage 1 of the feed pipeline: cheaply narrow "all posts" down to a pool of
~500-1000 plausible candidates, pulled from several independent sources.

Each source function returns a list of Post objects (or IDs). The caller
(generate_candidates) merges + de-duplicates them.
"""

from django.db import connection
from django.utils.timezone import now
from datetime import timedelta

from posts.models import Post, Community
from interactions.models import Interaction
from ml.session.session_state import get_session_embedding

PER_SOURCE_LIMIT = 150


def content_similarity_candidates(persona, limit=PER_SOURCE_LIMIT):
    """
    Nearest-neighbor vector search: posts closest to the persona's
    long-term embedding, using pgvector's cosine-distance operator (<=>).
    """
    if persona.embedding is None:
        return []

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id
            FROM posts
            ORDER BY embedding <=> %s
            LIMIT %s
            """,
            [list(persona.embedding), limit],
        )
        ids = [row[0] for row in cursor.fetchall()]

    return list(Post.objects.filter(id__in=ids))


def session_similarity_candidates(persona, limit=PER_SOURCE_LIMIT):
    """
    Same idea as content_similarity, but against the short-lived session
    embedding (Section 7) instead of the long-term persona embedding.
    Captures "what this persona is engaging with right now".
    """
    session_vec = get_session_embedding(persona.id)
    if session_vec is None:
        return []

    with connection.cursor() as cursor:
        cursor.execute(
            """
            SELECT id
            FROM posts
            ORDER BY embedding <=> %s
            LIMIT %s
            """,
            [session_vec.tolist(), limit],
        )
        ids = [row[0] for row in cursor.fetchall()]

    return list(Post.objects.filter(id__in=ids))


def collaborative_filtering_candidates(persona, limit=PER_SOURCE_LIMIT):
    """
    "Users who liked what you liked, also liked this."

    Simple version: find other personas who share a meaningful overlap of
    liked/engaged posts with this persona, then pull posts *those* personas
    engaged with that this persona hasn't seen yet.
    """
    liked_post_ids = Interaction.objects.filter(
        persona=persona, interaction_type__in=["like", "comment", "share"]
    ).values_list("post_id", flat=True)

    if not liked_post_ids:
        return []

    similar_persona_ids = (
        Interaction.objects.filter(
            post_id__in=liked_post_ids,
            interaction_type__in=["like", "comment", "share"],
        )
        .exclude(persona=persona)
        .values_list("persona_id", flat=True)
        .distinct()
    )

    candidate_ids = (
        Interaction.objects.filter(
            persona_id__in=similar_persona_ids,
            interaction_type__in=["like", "comment", "share"],
        )
        .exclude(post_id__in=liked_post_ids)
        .values_list("post_id", flat=True)
        .distinct()[:limit]
    )

    return list(Post.objects.filter(id__in=candidate_ids))


def trending_candidates(limit=PER_SOURCE_LIMIT, window_hours=48):
    """
    Posts with high recent engagement velocity, independent of
    personalization. Ensures new/viral content gets a chance even without
    a persona match history.
    """
    cutoff = now() - timedelta(hours=window_hours)
    return list(
        Post.objects.filter(created_at__gte=cutoff)
        .order_by("-upvotes", "-comment_count")[:limit]
    )


def community_candidates(persona, limit=PER_SOURCE_LIMIT):
    """
    Posts from communities the persona's user follows.
    """
    followed_community_ids = Community.objects.filter(
        followers__user=persona.user
    ).values_list("id", flat=True)

    return list(
        Post.objects.filter(community_id__in=followed_community_ids).order_by(
            "-created_at"
        )[:limit]
    )


def exploration_candidates(persona, limit=50):
    """
    A small random sample of posts *outside* the persona's usual pattern,
    deliberately injected to prevent filter-bubble stagnation.
    """
    return list(Post.objects.order_by("?")[:limit])


def generate_candidates(persona):
    """
    Pull from every source, merge, and de-duplicate by post id.
    Returns ~500-1000 candidates depending on how much overlap there is.
    """
    sources = [
        content_similarity_candidates(persona),
        session_similarity_candidates(persona),
        collaborative_filtering_candidates(persona),
        trending_candidates(),
        community_candidates(persona),
        exploration_candidates(persona),
    ]

    seen_ids = set()
    merged = []
    for source_results in sources:
        for post in source_results:
            if post.id not in seen_ids:
                seen_ids.add(post.id)
                merged.append(post)

    return merged
