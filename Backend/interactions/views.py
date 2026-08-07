from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Interaction, SavedPost, Repost
from posts.models import Post


from django.core.cache import cache
from personas.models import Persona, PersonaTopic

def update_session_cache(persona_id, post):
    cache_key = f"session_topics_{persona_id}"
    session_data = cache.get(cache_key, {})
    if post.broad_topic:
        session_data[post.broad_topic.id] = session_data.get(post.broad_topic.id, 0) + 1.0
    if post.narrow_topic:
        session_data[post.narrow_topic.id] = session_data.get(post.narrow_topic.id, 0) + 1.5
    cache.set(cache_key, session_data, 60 * 60) # 1 hour session

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def vote_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    persona_id = request.data.get("personaId") or request.query_params.get("personaId")
    persona = get_object_or_404(Persona, id=persona_id, user=request.user) if persona_id else request.user.default_persona
    
    if not persona:
        return Response({"error": "Persona required"}, status=400)
    
    direction = request.data.get("direction", 1) # 1 upvote, -1 downvote, 0 remove
    
    if direction == 1:
        interaction, created = Interaction.objects.get_or_create(persona=persona, post=post, interaction_type='like')
        is_liked = True
        if created:
            update_session_cache(persona.id, post)
    else:
        Interaction.objects.filter(persona=persona, post=post, interaction_type='like').delete()
        is_liked = False
        
    likes_count = Interaction.objects.filter(post=post, interaction_type='like').count()
    post.likes_count = likes_count
    post.save(update_fields=['likes_count'])
    
    return Response({
        "upvotes": str(likes_count),
        "userVote": 1 if is_liked else 0
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_save(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    saved, created = SavedPost.objects.get_or_create(user=request.user, post=post)
    if not created:
        saved.delete()
        return Response({"saved": False})
    return Response({"saved": True})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_repost(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    repost, created = Repost.objects.get_or_create(user=request.user, post=post)
    if not created:
        repost.delete()
        return Response({"reposted": False})
    return Response({"reposted": True})

@api_view(["POST"])
def log_click(request, post_id):
    if request.user.is_authenticated:
        post = get_object_or_404(Post, id=post_id)
        persona_id = request.data.get("personaId") or request.query_params.get("personaId")
        persona = get_object_or_404(Persona, id=persona_id, user=request.user) if persona_id else request.user.default_persona
        
        if persona:
            interaction, created = Interaction.objects.get_or_create(persona=persona, post=post, interaction_type='click')
            if created:
                post.clicks_count += 1
                post.save(update_fields=['clicks_count'])
                update_session_cache(persona.id, post)
    return Response({"success": True})

@api_view(["POST"])
def log_impression(request):
    if request.user.is_authenticated:
        post_ids = request.data.get("postIds", [])
        persona_id = request.data.get("personaId")
        persona = get_object_or_404(Persona, id=persona_id, user=request.user) if persona_id else request.user.default_persona
        
        if persona and post_ids:
            # Optimize to prevent SQLite lock contention
            existing_interactions = set(Interaction.objects.filter(
                persona=persona, 
                post_id__in=post_ids, 
                interaction_type='impression'
            ).values_list('post_id', flat=True))
            
            new_interactions = []
            for pid in post_ids:
                if pid not in existing_interactions:
                    new_interactions.append(Interaction(
                        persona=persona, 
                        post_id=pid, 
                        interaction_type='impression'
                    ))
            
            if new_interactions:
                Interaction.objects.bulk_create(new_interactions, ignore_conflicts=True)
                
                from django.db.models import F
                Post.objects.filter(id__in=[i.post_id for i in new_interactions]).update(
                    impressions_count=F('impressions_count') + 1
                )
    return Response({"success": True})
