from django.shortcuts import get_object_or_404
from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Interaction, SavedPost, Repost, Conversation, ConversationParticipant, Message
from posts.models import Post
from accounts.models import Follow

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def vote_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    user = request.user
    
    direction = request.data.get("direction", 1) # 1 upvote, -1 downvote, 0 remove
    
    # Simple like toggle implementation for MVP
    if direction == 1:
        Interaction.objects.get_or_create(user=user, post=post, interaction_type='like')
        is_liked = True
    else:
        Interaction.objects.filter(user=user, post=post, interaction_type='like').delete()
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
        Interaction.objects.create(user=request.user, post=post, interaction_type='click')
    return Response({"success": True})

@api_view(["POST"])
def log_impression(request, post_id):
    if request.user.is_authenticated:
        post = get_object_or_404(Post, id=post_id)
        Interaction.objects.create(user=request.user, post=post, interaction_type='impression')
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