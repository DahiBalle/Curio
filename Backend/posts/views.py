from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.core.paginator import Paginator

from .models import Post, PostMedia, Comment
from personas.models import Topic
from interactions.models import Interaction, SavedPost

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def create_post(request):
    persona = request.user.default_persona
    if not persona:
        return Response({"error": "No persona found"}, status=400)

    title = request.data.get("title")
    description = request.data.get("description", "")
    broad_topic_id = request.data.get("broadTopicId")
    narrow_topic_id = request.data.get("narrowTopicId")
    post_type = request.data.get("type", "text")
    media_file = request.FILES.get("media")

    if not title:
        return Response({"error": "Title required"}, status=400)

    broad_topic = None
    narrow_topic = None
    
    if broad_topic_id:
        if str(broad_topic_id).isdigit():
            try:
                broad_topic = Topic.objects.get(id=int(broad_topic_id), topic_type=Topic.BROAD)
            except Topic.DoesNotExist:
                pass
        else:
            broad_topic, _ = Topic.objects.get_or_create(name=str(broad_topic_id), defaults={'topic_type': Topic.BROAD})
            
    if narrow_topic_id:
        if str(narrow_topic_id).isdigit():
            try:
                narrow_topic = Topic.objects.get(id=int(narrow_topic_id), topic_type=Topic.NARROW)
            except Topic.DoesNotExist:
                pass
        else:
            narrow_topic, _ = Topic.objects.get_or_create(name=str(narrow_topic_id), defaults={'topic_type': Topic.NARROW})

    post = Post.objects.create(
        author_persona=persona,
        title=title,
        description=description,
        contains_media=bool(media_file),
        broad_topic=broad_topic,
        narrow_topic=narrow_topic
    )
            
    if media_file:
        PostMedia.objects.create(
            post=post,
            media_type=post_type,
            file=media_file
        )

    return Response({
        "id": f"post-{post.id}",
        "title": post.title,
        "createdAt": post.created_at.strftime("%Y-%m-%dT%H:%M:%SZ")
    }, status=201)

@api_view(["GET"])
def list_posts(request):
    # Fallback list endpoint
    posts_query = Post.objects.all().order_by("-created_at")
    paginator = Paginator(posts_query, request.query_params.get("limit", 10))
    page_obj = paginator.get_page(request.query_params.get("page", 1))
    
    data = []
    for post in page_obj:
        topic = post.narrow_topic if post.narrow_topic else post.broad_topic
        media = post.media.first()
        author = post.author_persona
        is_saved = False
        user_vote = 0
        if request.user.is_authenticated:
            is_saved = SavedPost.objects.filter(user=request.user, post=post).exists()
            persona = getattr(request.user, 'default_persona', None)
            if persona and Interaction.objects.filter(persona=persona, post=post, interaction_type='like').exists():
                user_vote = 1
            
        data.append({
            "id": f"post-{post.id}",
            "subreddit": topic.name if topic else None,
            "author": f"u/{author.user.username}" if author else None,
            "authorAvatar": request.build_absolute_uri(author.avatar.url) if (author and author.avatar) else None,
            "timeAgo": post.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "title": post.title,
            "description": post.description,
            "imageUrl": request.build_absolute_uri(media.file.url) if (media and media.file) else None,
            "upvotes": str(post.likes_count),
            "commentsCount": str(post.comments.count()),
            "type": media.media_type if media else "text",
            "isSaved": is_saved,
            "userVote": user_vote
        })
    return Response({"posts": data, "page": page_obj.number, "totalPages": paginator.num_pages})

def serialize_comment(c, request):
    c_author = c.persona
    return {
        "id": f"comment-{c.id}",
        "author": f"u/{c_author.user.username}" if c_author else None,
        "authorAvatar": request.build_absolute_uri(c_author.avatar.url) if (c_author and getattr(c_author, 'avatar', None)) else None,
        "content": c.content,
        "timeAgo": c.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "upvotes": str(c.likes_count),
        "replies": [serialize_comment(reply, request) for reply in c.replies.all().order_by('created_at')]
    }

@api_view(["GET"])
def post_detail(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    topic = post.narrow_topic if post.narrow_topic else post.broad_topic
    media = post.media.first()
    author = post.author_persona

    user_vote = 0
    is_saved = False
    if request.user.is_authenticated:
        # Check interactions
        interaction = Interaction.objects.filter(persona=request.user.default_persona, post=post, interaction_type='like').first()
        if interaction:
            user_vote = 1 # Assuming likes only for now (or upvotes)
            
        is_saved = SavedPost.objects.filter(user=request.user, post=post).exists()

    comments = [serialize_comment(c, request) for c in post.comments.filter(parent_comment__isnull=True).order_by('-created_at')]

    return Response({
        "id": f"post-{post.id}",
        "subreddit": topic.name if topic else None,
        "author": f"u/{author.user.username}" if author else None,
        "authorAvatar": request.build_absolute_uri(author.avatar.url) if (author and author.avatar) else None,
        "createdAt": post.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "timeAgo": post.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "title": post.title,
        "description": post.description,
        "imageUrl": request.build_absolute_uri(media.file.url) if (media and media.file) else None,
        "upvotes": str(post.likes_count),
        "commentsCount": str(post.comments.count()),
        "label": None,
        "type": media.media_type if media else "text",
        "userVote": user_vote,
        "isSaved": is_saved,
        "comments": comments
    })

@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
def update_post(request, post_id):
    post = get_object_or_404(Post, id=post_id, author_persona__user=request.user)
    title = request.data.get("title")
    description = request.data.get("description")
    if title:
        post.title = title
    if description is not None:
        post.description = description
    post.save()
    return Response({"success": True})

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_post(request, post_id):
    post = get_object_or_404(Post, id=post_id, author_persona__user=request.user)
    post.delete()
    return Response({"success": True})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_comment(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    persona = request.user.default_persona
    content = request.data.get("content")
    parent_id = request.data.get("parentId")
    
    if not content or not persona:
        return Response({"error": "Content and persona required"}, status=400)
        
    parent_comment = None
    if parent_id:
        if str(parent_id).startswith("comment-"):
            parent_id = str(parent_id).replace("comment-", "")
        parent_comment = get_object_or_404(Comment, id=parent_id, post=post)
        
    c = Comment.objects.create(post=post, persona=persona, content=content, parent_comment=parent_comment)
    return Response(serialize_comment(c, request), status=201)

@api_view(["GET"])
def get_comments(request, post_id):
    # Served inside post_detail but keep this if needed
    return Response([])

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_comment(request, comment_id):
    c = get_object_or_404(Comment, id=comment_id, persona__user=request.user)
    c.delete()
    return Response({"success": True})

@api_view(["POST"])
def record_click(request, post_id):
    # Moved to interactions app realistically, but we can leave placeholder
    return Response({"success": True})

@api_view(["POST"])
def record_impression(request, post_id):
    return Response({"success": True})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_media(request, post_id):
    return Response({"success": True})

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_media(request, media_id):
    return Response({"success": True})