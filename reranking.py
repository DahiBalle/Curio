"""
feed/services/reranking.py

Stage 4 of the feed pipeline: takes the ranked list and adjusts it — not
because the ranking was wrong, but because a naive top-N by score creates
bad feed experiences (everything from one community, no fresh content,
no room to learn about other interests).

Ranking answers "how relevant is this post in isolation"; re-ranking
answers "what's the best *set* of posts to put together."
"""

import random

MAX_CONSECUTIVE_SAME_COMMUNITY = 2
EXPLORATION_SLOTS_PER_PAGE = 2
FRESHNESS_BOOST_WINDOW_HOURS = 6
FRESHNESS_BOOST_AMOUNT = 0.05


def apply_freshness_boost(scored_posts):
    """
    Give very recent posts a small nudge so the feed doesn't feel stale,
    even if an older post scored slightly higher.
    """
    boosted = []
    for post, score in scored_posts:
        hours_old = (post.created_at and _hours_old(post)) or 0
        if hours_old <= FRESHNESS_BOOST_WINDOW_HOURS:
            score += FRESHNESS_BOOST_AMOUNT
        boosted.append((post, score))
    boosted.sort(key=lambda pair: pair[1], reverse=True)
    return boosted


def _hours_old(post):
    from django.utils.timezone import now
    return (now() - post.created_at).total_seconds() / 3600


def enforce_diversity(scored_posts, max_consecutive=MAX_CONSECUTIVE_SAME_COMMUNITY):
    """
    Prevents more than `max_consecutive` posts in a row from the same
    community by pulling a later post forward when a run gets too long.
    """
    result = list(scored_posts)
    i = 0
    while i < len(result):
        run_start = max(0, i - max_consecutive + 1)
        recent_communities = [result[j][0].community_id for j in range(run_start, i)]
        if len(recent_communities) == max_consecutive and len(set(recent_communities)) == 1:
            current_community = recent_communities[0]
            swap_index = next(
                (
                    j
                    for j in range(i + 1, len(result))
                    if result[j][0].community_id != current_community
                ),
                None,
            )
            if swap_index is not None:
                result[i], result[swap_index] = result[swap_index], result[i]
        i += 1
    return result


def inject_exploration_slots(scored_posts, exploration_pool, slots=EXPLORATION_SLOTS_PER_PAGE):
    """
    Reserves a couple of feed positions for content different from the
    persona's norm, regardless of score, to keep gathering signal on
    other interests.
    """
    if not exploration_pool or slots <= 0:
        return scored_posts

    existing_ids = {post.id for post, _ in scored_posts}
    fresh_exploration = [p for p in exploration_pool if p.id not in existing_ids]
    if not fresh_exploration:
        return scored_posts

    chosen = random.sample(fresh_exploration, min(slots, len(fresh_exploration)))
    result = list(scored_posts)
    # Spread exploration picks roughly evenly through the page rather than
    # bunching them all at the top or bottom.
    step = max(1, len(result) // (len(chosen) + 1))
    for idx, post in enumerate(chosen):
        insert_at = min(len(result), (idx + 1) * step)
        result.insert(insert_at, (post, None))  # score=None marks exploration content
    return result


def rerank(scored_posts, exploration_pool=None):
    """
    Full re-ranking pass: freshness boost -> diversity enforcement ->
    exploration slot injection.
    """
    boosted = apply_freshness_boost(scored_posts)
    diversified = enforce_diversity(boosted)
    final = inject_exploration_slots(diversified, exploration_pool or [])
    return [post for post, _ in final]
