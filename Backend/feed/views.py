from django.utils import timezone
from django.db.models import Q
from django.core.cache import cache
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import os
from django.conf import settings

from personas.models import Persona, PersonaTopic, Topic
from posts.models import Post
from interactions.models import Interaction, SavedPost

# Thread-safe lazy loading of the ML model
import threading

GLOBAL_MODEL = None
MODEL_LOCK = threading.Lock()
MODEL_PATH = os.path.join(settings.BASE_DIR, 'ml', 'saved_models', 'ranking_model.pkl')

def get_ml_model():
    global GLOBAL_MODEL
    if GLOBAL_MODEL is not None:
        return GLOBAL_MODEL
        
    if not os.path.exists(MODEL_PATH):
        return None
        
    with MODEL_LOCK:
        # Check again inside the lock to prevent double loading
        if GLOBAL_MODEL is not None:
            return GLOBAL_MODEL
            
        try:
            import joblib
            print("Loading ML model into memory... (this may take a few seconds)")
            GLOBAL_MODEL = joblib.load(MODEL_PATH)
            print("ML model loaded successfully.")
            return GLOBAL_MODEL
        except Exception as e:
            print(f"Failed to load ranking model: {e}")
            return None

def serialize_posts(posts, request):
    data = []
    
    saved_post_ids = set()
    liked_post_ids = set()
    
    if request.user.is_authenticated:
        persona = getattr(request.user, 'default_persona', None)
        post_ids = [p.id for p in posts]
        saved_post_ids = set(SavedPost.objects.filter(user=request.user, post_id__in=post_ids).values_list('post_id', flat=True))
        if persona:
            liked_post_ids = set(Interaction.objects.filter(persona=persona, post_id__in=post_ids, interaction_type='like').values_list('post_id', flat=True))
            
    for post in posts:
        topic = post.narrow_topic if post.narrow_topic else post.broad_topic
        media = post.media.first()
        author = post.author_persona
        data.append({
            "id": f"post-{post.id}",
            "subreddit": topic.name if topic else None,
            "author": f"u/{author.user.username}" if author else None,
            "authorAvatar": request.build_absolute_uri(author.avatar.url) if (author and getattr(author, 'avatar', None)) else None,
            "timeAgo": post.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "title": post.title,
            "description": post.description,
            "imageUrl": request.build_absolute_uri(media.file.url) if (media and getattr(media, 'file', None)) else None,
            "upvotes": str(post.likes_count),
            "commentsCount": str(post.comments.count()),
            "type": media.media_type if media else "text",
            "isSaved": post.id in saved_post_ids,
            "userVote": 1 if post.id in liked_post_ids else 0
        })
    return data

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def generate_feed(request):
    persona_id = request.query_params.get("personaId")
    page = int(request.query_params.get("page", 1))
    
    persona = get_object_or_404(Persona, id=persona_id, user=request.user) if persona_id else request.user.default_persona
    
    if not persona:
        return Response({"error": "Persona required"}, status=400)
    
    # 1. Candidate Generation
    affinity_scores = {pt.topic_id: pt.weight for pt in PersonaTopic.objects.filter(persona=persona)}
    
    # Fetch topics to separate broad and narrow
    topics = Topic.objects.filter(id__in=affinity_scores.keys())
    broad_topic_ids = [t.id for t in topics if t.topic_type == Topic.BROAD]
    narrow_topic_ids = [t.id for t in topics if t.topic_type == Topic.NARROW]
    
    candidates = Post.objects.filter(
        Q(broad_topic__in=broad_topic_ids) | Q(narrow_topic__in=narrow_topic_ids)
    )
    
    # 2. Filter out seen posts and get latest 1000 candidates to prevent memory overload
    # Evaluate the subquery to a list immediately. SQLite is notoriously slow with NOT IN (SELECT...) subqueries.
    seen_post_ids = list(Interaction.objects.filter(
        persona=persona, 
        interaction_type='impression'
    ).values_list('post_id', flat=True))
    
    candidates = candidates.exclude(id__in=seen_post_ids).order_by('-created_at')[:1000]
    
    # 3. Rank
    session_data = cache.get(f"session_topics_{persona.id}", {})
    now = timezone.now()
    
    # Try loading the model lazily
    model = get_ml_model()
            
    ranked_posts = []
    features_list = []
    
    for post in candidates:
        broad_affinity = affinity_scores.get(post.broad_topic_id, 0.1)
        narrow_affinity = affinity_scores.get(post.narrow_topic_id, 0.1)
        session_boost = session_data.get(post.broad_topic_id, 0) * 0.4 + session_data.get(post.narrow_topic_id, 0) * 0.6
        
        days_diff = (now - post.created_at).days
        time_decay = 1 / (1 + max(0, days_diff))
        quality_score = (post.likes_count * 2 + post.clicks_count) / max(post.impressions_count, 1)
        
        if model:
            features = [broad_affinity, narrow_affinity, time_decay, quality_score]
            features_list.append((post, features, session_boost))
        else:
            base_score = broad_affinity * 0.4 + narrow_affinity * 0.6
            final_score = (base_score + session_boost) * time_decay * quality_score
            ranked_posts.append((post, final_score))
            
    if model and features_list:
        X = [f[1] for f in features_list]
        probs = model.predict_proba(X)[:, 1]
        for idx, (post, _, session_boost) in enumerate(features_list):
            ml_score = probs[idx]
            # Blend ML score with session boost since session boost isn't in training
            final_score = ml_score + (session_boost * 0.5)
            ranked_posts.append((post, final_score))
            
    ranked_posts.sort(key=lambda x: x[1], reverse=True)
    
    # Take top 20 for the requested page
    limit = 20
    start_idx = (page - 1) * limit
    end_idx = start_idx + limit
    
    top_posts = [p[0] for p in ranked_posts[start_idx:end_idx]]
    
    # Fallback if no posts match topics
    if not top_posts:
        more_posts = Post.objects.exclude(id__in=[p.id for p in top_posts]).exclude(id__in=seen_post_ids).order_by('-created_at')[start_idx:end_idx]
        top_posts.extend(more_posts)
        
    serialized_posts = serialize_posts(top_posts, request)
    
    return Response({
        "posts": serialized_posts,
        "page": page,
        "totalPages": 1, # Not calculated for infinite scroll
        "totalPosts": len(ranked_posts)
    })
