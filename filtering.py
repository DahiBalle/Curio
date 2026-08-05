"""
feed/services/filtering.py

Stage 2 of the feed pipeline: remove candidates that should never be shown,
regardless of relevance score. This is deliberately kept separate from
ranking (Section 1) — don't make the ranking model learn "don't show
already-seen posts"; just filter those out directly.
"""

from django.utils.timezone import now
from datetime import timedelta

from interactions.models import Interaction

DEFAULT_MAX_POST_AGE_DAYS = 30


def already_seen_post_ids(persona):
    return set(
        Interaction.objects.filter(persona=persona)
        .values_list("post_id", flat=True)
        .distinct()
    )


def blocked_user_ids(persona):
    return set(persona.user.blocked_users.values_list("id", flat=True))


def blocked_community_ids(persona):
    return set(persona.user.blocked_communities.values_list("id", flat=True))


def filter_candidates(
    candidates,
    persona,
    max_age_days=DEFAULT_MAX_POST_AGE_DAYS,
    allow_repeats=False,
):
    """
    Applies all eligibility filters and returns only the posts that are
    allowed to be shown to this persona.
    """
    seen_ids = set() if allow_repeats else already_seen_post_ids(persona)
    blocked_users = blocked_user_ids(persona)
    blocked_communities = blocked_community_ids(persona)
    age_cutoff = now() - timedelta(days=max_age_days)
    nsfw_allowed = getattr(persona.user, "allow_nsfw", False)

    filtered = []
    for post in candidates:
        if post.id in seen_ids:
            continue
        if post.author_id in blocked_users:
            continue
        if post.community_id in blocked_communities:
            continue
        if getattr(post, "is_removed", False) or getattr(post, "is_reported", False):
            continue
        if getattr(post, "is_nsfw", False) and not nsfw_allowed:
            continue
        # Evergreen content (flagged explicitly) is exempt from the age filter.
        if post.created_at < age_cutoff and not getattr(post, "is_evergreen", False):
            continue

        filtered.append(post)

    return filtered
