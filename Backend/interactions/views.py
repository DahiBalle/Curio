from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Max, Q
from Backend.interactions.models import Conversation, Message
from Backend.accounts.models import User

from Backend.posts.models import Post
from Backend.interactions.models import Like, Save, Share, Interaction


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_like(request, post_id):

    persona = request.user.profile.active_persona

    # -------------------------
    # Active Persona Check
    # -------------------------

    if not persona:
        return Response(
            {"error": "No active persona selected."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # -------------------------
    # Fetch Post
    # -------------------------

    try:
        post = Post.objects.get(
            id=post_id,
            is_removed=False
        )

    except Post.DoesNotExist:
        return Response(
            {"error": "Post not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    # -------------------------
    # Toggle Like
    # -------------------------

    like = Like.objects.filter(persona=persona, post=post).first()

    if like:

        like.delete()

        if post.like_count > 0:
            post.like_count -= 1
            post.save(update_fields=["like_count"])

        Interaction.objects.create(
            persona=persona,
            post=post,
            interaction_type=Interaction.UNLIKE
        )

        return Response(
            {
                "message": "Post unliked.",
                "liked": False,
                "like_count": post.like_count
            },
            status=status.HTTP_200_OK
        )

    Like.objects.create(persona=persona, post=post)

    post.like_count += 1
    post.save(update_fields=["like_count"])

    Interaction.objects.create(
        persona=persona,
        post=post,
        interaction_type=Interaction.LIKE
    )

    return Response(
        {
            "message": "Post liked.",
            "liked": True,
            "like_count": post.like_count
        },
        status=status.HTTP_201_CREATED
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_save(request, post_id):

    persona = request.user.profile.active_persona

    if not persona:
        return Response(
            {"error": "No active persona selected."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        post = Post.objects.get(
            id=post_id,
            is_removed=False
        )

    except Post.DoesNotExist:
        return Response(
            {"error": "Post not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    save = Save.objects.filter(persona=persona, post=post).first()

    if save:

        save.delete()

        if post.save_count > 0:
            post.save_count -= 1
            post.save(update_fields=["save_count"])

        Interaction.objects.create(
            persona=persona,
            post=post,
            interaction_type=Interaction.UNSAVE
        )

        return Response(
            {
                "message": "Post unsaved.",
                "saved": False,
                "save_count": post.save_count
            },
            status=status.HTTP_200_OK
        )

    Save.objects.create(persona=persona, post=post)

    post.save_count += 1
    post.save(update_fields=["save_count"])

    Interaction.objects.create(
        persona=persona,
        post=post,
        interaction_type=Interaction.SAVE
    )

    return Response(
        {
            "message": "Post saved.",
            "saved": True,
            "save_count": post.save_count
        },
        status=status.HTTP_201_CREATED
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def share_post(request, post_id):

    persona = request.user.profile.active_persona

    if not persona:
        return Response(
            {"error": "No active persona selected."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        post = Post.objects.get(
            id=post_id,
            is_removed=False
        )

    except Post.DoesNotExist:
        return Response(
            {"error": "Post not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    Share.objects.create(persona=persona, post=post)

    post.share_count += 1
    post.save(update_fields=["share_count"])

    Interaction.objects.create(
        persona=persona,
        post=post,
        interaction_type=Interaction.SHARE
    )

    return Response(
        {
            "message": "Post shared.",
            "share_count": post.share_count
        },
        status=status.HTTP_201_CREATED
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def log_view(request, post_id):

    persona = request.user.profile.active_persona

    if not persona:
        return Response(
            {"error": "No active persona selected."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        post = Post.objects.get(
            id=post_id,
            is_removed=False
        )

    except Post.DoesNotExist:
        return Response(
            {"error": "Post not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    post.view_count += 1
    post.save(update_fields=["view_count"])

    Interaction.objects.create(
        persona=persona,
        post=post,
        interaction_type=Interaction.VIEW
    )

    return Response(
        {
            "message": "View logged.",
            "view_count": post.view_count
        },
        status=status.HTTP_200_OK
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def log_impressions(request):

    persona = request.user.profile.active_persona

    if not persona:
        return Response(
            {"error": "No active persona selected."},
            status=status.HTTP_400_BAD_REQUEST
        )

    post_ids = request.data.get("post_ids", [])

    if not post_ids or not isinstance(post_ids, list):
        return Response(
            {"error": "post_ids must be a non-empty list."},
            status=status.HTTP_400_BAD_REQUEST
        )

    posts = Post.objects.filter(id__in=post_ids, is_removed=False)

    interaction_objs = []

    for post in posts:

        post.impression_count += 1
        interaction_objs.append(
            Interaction(
                persona=persona,
                post=post,
                interaction_type=Interaction.IMPRESSION
            )
        )

    Post.objects.bulk_update(posts, ["impression_count"])
    Interaction.objects.bulk_create(interaction_objs)

    return Response(
        {
            "message": "Impressions logged.",
            "count": len(interaction_objs)
        },
        status=status.HTTP_201_CREATED
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def log_interaction(request, post_id):

    # Generic endpoint for feed-signal events: click, dwell, skip

    persona = request.user.profile.active_persona

    if not persona:
        return Response(
            {"error": "No active persona selected."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        post = Post.objects.get(
            id=post_id,
            is_removed=False
        )

    except Post.DoesNotExist:
        return Response(
            {"error": "Post not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    interaction_type = request.data.get("interaction_type")
    dwell_seconds = request.data.get("dwell_seconds")

    valid_types = [
        Interaction.CLICK,
        Interaction.DWELL,
        Interaction.SKIP
    ]

    if interaction_type not in valid_types:
        return Response(
            {"error": f"interaction_type must be one of {valid_types}."},
            status=status.HTTP_400_BAD_REQUEST
        )

    Interaction.objects.create(
        persona=persona,
        post=post,
        interaction_type=interaction_type,
        dwell_seconds=dwell_seconds
    )

    return Response(
        {"message": "Interaction logged."},
        status=status.HTTP_201_CREATED
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def liked_posts(request):

    persona = request.user.profile.active_persona

    if not persona:
        return Response(
            {"error": "No active persona selected."},
            status=status.HTTP_400_BAD_REQUEST
        )

    likes = (
        Like.objects
        .filter(persona=persona)
        .select_related("post", "post__author")
        .order_by("-created_at")
    )

    data = [
        {
            "post_id": like.post.id,
            "title": like.post.title,
            "liked_at": like.created_at
        }
        for like in likes
        if not like.post.is_removed
    ]

    return Response(
        {"count": len(data), "posts": data},
        status=status.HTTP_200_OK
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def saved_posts(request):

    persona = request.user.profile.active_persona

    if not persona:
        return Response(
            {"error": "No active persona selected."},
            status=status.HTTP_400_BAD_REQUEST
        )

    saves = (
        Save.objects
        .filter(persona=persona)
        .select_related("post", "post__author")
        .order_by("-created_at")
    )

    data = [
        {
            "post_id": save.post.id,
            "title": save.post.title,
            "saved_at": save.created_at
        }
        for save in saves
        if not save.post.is_removed
    ]

    return Response(
        {"count": len(data), "posts": data},
        status=status.HTTP_200_OK
    )

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start_conversation(request):

    recipient_id = request.data.get("recipient_id")

    if not recipient_id:
        return Response(
            {"error": "recipient_id is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if int(recipient_id) == request.user.id:
        return Response(
            {"error": "You cannot start a conversation with yourself."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        recipient = User.objects.get(id=recipient_id)

    except User.DoesNotExist:
        return Response(
            {"error": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    # -------------------------
    # Reuse Existing Conversation
    # -------------------------

    conversation = (
        Conversation.objects
        .filter(participants=request.user)
        .filter(participants=recipient)
        .first()
    )

    if not conversation:
        conversation = Conversation.objects.create()
        conversation.participants.add(request.user, recipient)

    return Response(
        {
            "message": "Conversation ready.",
            "conversation_id": conversation.id
        },
        status=status.HTTP_200_OK
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def list_conversations(request):

    conversations = (
        Conversation.objects
        .filter(participants=request.user)
        .annotate(last_message_at=Max("messages__created_at"))
        .order_by("-last_message_at")
    )

    data = []

    for convo in conversations:

        other = convo.participants.exclude(id=request.user.id).first()
        last_message = convo.messages.last()

        unread_count = convo.messages.filter(
            is_read=False
        ).exclude(sender=request.user).count()

        data.append({
            "conversation_id": convo.id,
            "with_user": {
                "id": other.id if other else None,
                "username": other.username if other else None
            },
            "last_message": (
                {
                    "content": last_message.content,
                    "sender_id": last_message.sender.id,
                    "created_at": last_message.created_at
                }
                if last_message else None
            ),
            "unread_count": unread_count
        })

    return Response(
        {"count": len(data), "conversations": data},
        status=status.HTTP_200_OK
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def conversation_messages(request, conversation_id):

    try:
        conversation = Conversation.objects.get(
            id=conversation_id,
            participants=request.user
        )

    except Conversation.DoesNotExist:
        return Response(
            {"error": "Conversation not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    messages = conversation.messages.select_related("sender")

    # -------------------------
    # Mark Incoming Messages Read
    # -------------------------

    messages.filter(is_read=False).exclude(
        sender=request.user
    ).update(is_read=True)

    data = [
        {
            "id": msg.id,
            "sender_id": msg.sender.id,
            "sender_username": msg.sender.username,
            "content": msg.content,
            "is_read": msg.is_read,
            "created_at": msg.created_at
        }
        for msg in messages
    ]

    return Response(
        {"count": len(data), "messages": data},
        status=status.HTTP_200_OK
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def send_message(request, conversation_id):

    try:
        conversation = Conversation.objects.get(
            id=conversation_id,
            participants=request.user
        )

    except Conversation.DoesNotExist:
        return Response(
            {"error": "Conversation not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    content = request.data.get("content", "").strip()

    if not content:
        return Response(
            {"error": "Message content cannot be empty."},
            status=status.HTTP_400_BAD_REQUEST
        )

    message = Message.objects.create(
        conversation=conversation,
        sender=request.user,
        content=content
    )

    conversation.save(update_fields=[])  # bump updated_at via auto_now
    conversation.updated_at = message.created_at
    conversation.save(update_fields=["updated_at"])

    return Response(
        {
            "message": "Message sent.",
            "data": {
                "id": message.id,
                "sender_id": message.sender.id,
                "content": message.content,
                "created_at": message.created_at
            }
        },
        status=status.HTTP_201_CREATED
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_message(request, message_id):

    try:
        message = Message.objects.select_related(
            "conversation"
        ).get(id=message_id)

    except Message.DoesNotExist:
        return Response(
            {"error": "Message not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    if message.sender != request.user:
        return Response(
            {"error": "You can only delete your own messages."},
            status=status.HTTP_403_FORBIDDEN
        )

    message.delete()

    return Response(
        {"message": "Message deleted."},
        status=status.HTTP_200_OK
    )