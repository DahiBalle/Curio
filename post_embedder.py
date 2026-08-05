"""
ml/embeddings/post_embedder.py

Generates content embeddings for posts using a pretrained sentence-transformers
model. No training required — just run text through the model.
"""

from sentence_transformers import SentenceTransformer

EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"  # 384-dimensional, small, fast on CPU
EMBEDDING_DIM = 384

_model = None


def get_model():
    """Lazily loads the model once per process (loading is relatively slow)."""
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBEDDING_MODEL_NAME)
    return _model


def embed_post(title: str, body: str) -> list[float]:
    """
    Turns a post's title + body into a 384-dim embedding vector.
    Call this on post creation (e.g. a Django post_save signal) and store
    the result in the post's `embedding` column.
    """
    text = f"{title}. {body or ''}"
    vector = get_model().encode(text)
    return vector.tolist()


def embed_posts_bulk(posts) -> dict:
    """
    Batch-embeds many posts at once (much faster than calling embed_post
    in a loop). Used for the one-off backfill script when adding embeddings
    to an existing database (Section 9, Step 3).

    Returns a dict of {post_id: embedding_list}.
    """
    texts = [f"{p.title}. {p.body or ''}" for p in posts]
    vectors = get_model().encode(texts, batch_size=64, show_progress_bar=True)
    return {post.id: vector.tolist() for post, vector in zip(posts, vectors)}
