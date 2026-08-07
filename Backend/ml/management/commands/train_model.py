from django.core.management.base import BaseCommand
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score
import joblib
import os
from django.conf import settings
from interactions.models import Interaction
from personas.models import PersonaTopic

class Command(BaseCommand):
    help = 'Trains the ML ranking model for feed recommendation using bulk database queries'

    def handle(self, *args, **options):
        self.stdout.write("Gathering training data using bulk queries...")
        
        # 1. Fetch all positive engagement interactions in a single bulk query (Set of (persona_id, post_id))
        engaged_pairs = set(
            Interaction.objects.filter(
                interaction_type__in=['like', 'comment', 'share', 'click']
            ).values_list('persona_id', 'post_id')
        )
        
        # 2. Fetch all PersonaTopic affinity scores in a single bulk query -> Map of (persona_id, topic_id) -> weight
        affinity_map = {}
        for pt in PersonaTopic.objects.values('persona_id', 'topic_id', 'weight'):
            affinity_map[(pt['persona_id'], pt['topic_id'])] = pt['weight']
        
        # 3. Bulk fetch all impression records with related persona and post
        impressions = Interaction.objects.filter(interaction_type='impression').select_related('persona', 'post')
        
        data = []
        for imp in impressions:
            persona_id = imp.persona_id
            post = imp.post
            
            if not post:
                continue
            
            # Fast O(1) in-memory check if persona engaged with post
            label = 1 if (persona_id, post.id) in engaged_pairs else 0
            
            # Fast O(1) in-memory lookups for topic affinity
            broad_affinity = affinity_map.get((persona_id, post.broad_topic_id), 0.1) if post.broad_topic_id else 0.1
            narrow_affinity = affinity_map.get((persona_id, post.narrow_topic_id), 0.1) if post.narrow_topic_id else 0.1
            
            time_decay = 1 / (1 + max(0, (imp.created_at - post.created_at).days))
            quality_score = (post.likes_count * 2 + post.clicks_count) / max(post.impressions_count, 1)
            
            data.append({
                'broad_affinity': broad_affinity,
                'narrow_affinity': narrow_affinity,
                'time_decay': time_decay,
                'quality_score': quality_score,
                'label': label
            })
            
        if not data:
            self.stdout.write(self.style.WARNING("No training data available. Need impressions first."))
            return
            
        labels = [d['label'] for d in data]
        if len(set(labels)) < 2:
            self.stdout.write(self.style.WARNING("Need both positive and negative examples to train model."))
            return
            
        X = [[d['broad_affinity'], d['narrow_affinity'], d['time_decay'], d['quality_score']] for d in data]
        y = labels
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        self.stdout.write(f"Training Logistic Regression on {len(X_train)} samples...")
        model = LogisticRegression(class_weight='balanced')
        model.fit(X_train, y_train)
        
        y_pred = model.predict_proba(X_test)[:, 1]
        auc = roc_auc_score(y_test, y_pred)
        
        self.stdout.write(self.style.SUCCESS(f"Model trained! AUC: {auc:.4f}"))
        
        # Save model
        model_dir = os.path.join(settings.BASE_DIR, 'ml', 'saved_models')
        os.makedirs(model_dir, exist_ok=True)
        model_path = os.path.join(model_dir, 'ranking_model.pkl')
        
        joblib.dump(model, model_path)
        self.stdout.write(self.style.SUCCESS(f"Model saved to {model_path}"))
