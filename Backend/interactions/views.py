from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Interaction, SavedPost, Repost, Conversation, ConversationParticipant, Message
from posts.models import Post
from accounts.models import Follow

from django.core.cache import cache
from personas.models import Persona, PersonaTopic

def update_topic_affinity(persona, post, weight_change):
    if post.broad_topic:
        pt, _ = PersonaTopic.objects.get_or_create(persona=persona, topic=post.broad_topic)
        pt.weight += weight_change
        pt.save()
    if post.narrow_topic:
        pt, _ = PersonaTopic.objects.get_or_create(persona=persona, topic=post.narrow_topic)
        pt.weight += (weight_change * 1.5) # Narrow topic gets slightly higher boost
        pt.save()

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
            update_topic_affinity(persona, post, 1.0)
            update_session_cache(persona.id, post)
    else:
        Interaction.objects.filter(persona=persona, post=post, interaction_type='like').delete()
        is_liked = False
        update_topic_affinity(persona, post, -1.0)
        
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
                update_topic_affinity(persona, post, 0.5)
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

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_threads(request):
    participants = ConversationParticipant.objects.filter(user=request.user)
    threads = []
    
    for p in participants:
        conv = p.conversation
        # Get other participant
        other = ConversationParticipant.objects.filter(conversation=conv).exclude(user=request.user).first()
        if other:
            last_message = conv.messages.order_by('-created_at').first()
            other_user = other.user
            other_persona = other_user.default_persona
            
            threads.append({
                "id": f"thread-{conv.id}",
                "user": {
                    "name": other_persona.name if other_persona else other_user.username,
                    "username": other_user.username,
                    "avatarUrl": request.build_absolute_uri(other_persona.avatar.url) if (other_persona and other_persona.avatar) else None
                },
                "lastMessage": last_message.content if last_message else "",
                "timestamp": last_message.created_at.strftime("%Y-%m-%dT%H:%M:%SZ") if last_message else conv.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
                "isUnread": last_message.is_read == False and last_message.sender != request.user if last_message else False
            })
            
    return Response(threads)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_requests(request):
    return Response([])

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def unread_count(request):
    count = Message.objects.filter(
        conversation__participants__user=request.user,
        is_read=False
    ).exclude(sender=request.user).count()
    return Response({"count": count})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accept_request(request, request_id):
    return Response({"success": True})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def decline_request(request, request_id):
    return Response({"success": True})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def thread_messages(request, thread_id):
    if str(thread_id).startswith('thread-'):
        thread_id = str(thread_id).split('-')[1]
        
    conv = get_object_or_404(Conversation, id=int(thread_id))
    
    if not ConversationParticipant.objects.filter(conversation=conv, user=request.user).exists():
        return Response({"error": "Not a participant"}, status=403)
        
    messages = conv.messages.order_by('created_at')
    
    # Mark as read
    conv.messages.filter(is_read=False).exclude(sender=request.user).update(is_read=True)
    
    data = []
    for msg in messages:
        data.append({
            "id": msg.id,
            "message": msg.content,
            "senderId": msg.sender_id,
            "timestamp": msg.created_at.strftime("%Y-%m-%dT%H:%M:%SZ")
        })
        
    return Response(data)