"""
ml/ranking_model/train.py

Offline training script (Section 5 / Section 8). Run this periodically
(nightly/weekly, via a scheduled job) as new interaction data accumulates.
Training happens offline in a batch job — never train a model live inside
a web request.

Usage (as a Django management command or standalone script with
DJANGO_SETTINGS_MODULE set):

    python ml/ranking_model/train.py
"""

import joblib
from django.db.models import Q
from django.utils.timezone import now
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import roc_auc_score
from sklearn.model_selection import train_test_split

from interactions.models import Interaction
from posts.models import Post
from ml.ranking_model.features import build_feature_vector

MODEL_OUTPUT_PATH = "ml/ranking_model/model.pkl"
ENGAGEMENT_DWELL_THRESHOLD_SECONDS = 5


def build_training_row(persona_id, post_id, was_shown_at, persona, post, session_embedding=None, context=None):
    """
    Joins "what was shown" against "what happened" to build one labeled
    training row. Requires impression logging (interaction_type='impression')
    so negative examples exist alongside positives.
    """
    interactions_after = Interaction.objects.filter(
        persona_id=persona_id, post_id=post_id, created_at__gte=was_shown_at
    )
    engaged = interactions_after.filter(
        Q(interaction_type__in=["like", "comment", "share"])
        | Q(dwell_seconds__gte=ENGAGEMENT_DWELL_THRESHOLD_SECONDS)
    ).exists()

    label = 1 if engaged else 0
    features = build_feature_vector(persona, post, session_embedding, context or {})
    return {**features, "label": label}


def build_training_table():
    """
    Iterates over logged impressions and builds the full labeled dataset.
    """
    impressions = Interaction.objects.filter(interaction_type="impression").select_related(
        "persona", "post"
    )

    rows = []
    for impression in impressions:
        row = build_training_row(
            persona_id=impression.persona_id,
            post_id=impression.post_id,
            was_shown_at=impression.created_at,
            persona=impression.persona,
            post=impression.post,
        )
        rows.append(row)

    return rows


def train_and_evaluate(rows, test_size=0.2, random_state=42):
    feature_keys = sorted(k for k in rows[0].keys() if k != "label")

    X = [[row[k] for k in feature_keys] for row in rows]
    y = [row["label"] for row in rows]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=random_state, stratify=y
    )

    model = LogisticRegression(max_iter=1000)
    model.fit(X_train, y_train)

    probs = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, probs)
    print(f"Held-out AUC: {auc:.4f} (0.5 = random, 1.0 = perfect)")
    print(f"Feature order used by the model: {feature_keys}")

    return model, auc


def main():
    print(f"Building training table at {now().isoformat()}...")
    rows = build_training_table()
    print(f"Built {len(rows)} training rows.")

    if len(rows) < 50:
        print("Not enough data to train reliably yet — accumulate more interactions first.")
        return

    model, auc = train_and_evaluate(rows)
    joblib.dump(model, MODEL_OUTPUT_PATH)
    print(f"Saved trained model to {MODEL_OUTPUT_PATH}")


if __name__ == "__main__":
    main()
