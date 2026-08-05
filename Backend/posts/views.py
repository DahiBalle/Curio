from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from posts.models import Post, PostMedia, Comment
 


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_post(request):

    profile = request.user.profile
    persona = profile.active_persona

    # -------------------------
    # Active Persona Check
    # -------------------------

    if not persona:
        return Response(
            {
                "error": "No active persona selected."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    title = request.data.get("title", "").strip()
    content = request.data.get("content", "").strip()
    tags = request.data.get("tags", "").strip()

    visibility = request.data.get(
        "visibility",
        Post.PUBLIC
    )

    is_nsfw = request.data.get(
        "is_nsfw",
        False
    )

    # -------------------------
    # Validation
    # -------------------------

    if not title:
        return Response(
            {
                "error": "Title is required."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    if not content:
        return Response(
            {
                "error": "Content is required."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    # -------------------------
    # Create Post
    # -------------------------

    post = Post.objects.create(
        author=persona,
        title=title,
        content=content,
        tags=tags,
        visibility=visibility,
        is_nsfw=is_nsfw
    )

    # -------------------------
    # Update Profile Counter
    # -------------------------

    profile.posts_count += 1
    profile.save(update_fields=["posts_count"])

    return Response(
        {
            "message": "Post created successfully.",

            "post": {
                "id": post.id,
                "title": post.title,
                "content": post.content,
                "author": persona.name,
                "visibility": post.visibility,
                "created_at": post.created_at
            }
        },
        status=status.HTTP_201_CREATED
    )

@api_view(["GET"])
def list_posts(request):

    posts = (
        Post.objects
        .filter(is_removed=False)
        .select_related("author", "author__user")
        .prefetch_related("media")
        .order_by("-created_at")
    )

    data = []

    for post in posts:

        media = []

        for item in post.media.all():

            media.append({
                "id": item.id,
                "type": item.media_type,
                "url": request.build_absolute_uri(item.file.url)
            })

        data.append({

            "id": post.id,

            "author": {
                "id": post.author.id,
                "name": post.author.name,
                "avatar": (
                    request.build_absolute_uri(post.author.avatar.url)
                    if post.author.avatar
                    else None
                )
            },

            "title": post.title,
            "content": post.content,
            "tags": post.tags,
            "post_type": post.post_type,
            "visibility": post.visibility,

            "media": media,

            "stats": {
                "likes": post.like_count,
                "comments": post.comment_count,
                "shares": post.share_count,
                "saves": post.save_count,
                "views": post.view_count,
                "impressions": post.impression_count,
            },

            "is_nsfw": post.is_nsfw,
            "created_at": post.created_at,
            "updated_at": post.updated_at,
        })

    return Response(
        {
            "count": len(data),
            "posts": data
        },
        status=status.HTTP_200_OK
    )

@api_view(["GET"])
def post_detail(request, post_id):

    post = get_object_or_404(
        Post.objects.select_related(
            "author",
            "author__user"
        ).prefetch_related(
            "media"
        ),
        id=post_id,
        is_removed=False
    )

    media = []

    for item in post.media.all():

        media.append({
            "id": item.id,
            "type": item.media_type,
            "url": request.build_absolute_uri(item.file.url)
        })

    return Response(
        {
            "id": post.id,

            "author": {
                "id": post.author.id,
                "name": post.author.name,

                "avatar": (
                    request.build_absolute_uri(post.author.avatar.url)
                    if post.author.avatar
                    else None
                )
            },

            "title": post.title,
            "content": post.content,
            "tags": post.tags,

            "post_type": post.post_type,
            "visibility": post.visibility,

            "media": media,

            "stats": {
                "likes": post.like_count,
                "comments": post.comment_count,
                "shares": post.share_count,
                "saves": post.save_count,
                "views": post.view_count,
                "impressions": post.impression_count
            },

            "is_nsfw": post.is_nsfw,

            "created_at": post.created_at,
            "updated_at": post.updated_at
        },
        status=status.HTTP_200_OK
    )


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_post(request, post_id):

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

    if post.author != persona:
        return Response(
            {"error": "You can only edit your own posts."},
            status=status.HTTP_403_FORBIDDEN
        )

    title = request.data.get("title", post.title).strip()
    content = request.data.get("content", post.content).strip()
    tags = request.data.get("tags", post.tags).strip()

    if not title:
        return Response(
            {"error": "Title is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not content:
        return Response(
            {"error": "Content is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    post.title = title
    post.content = content
    post.tags = tags

    post.save(update_fields=[
        "title",
        "content",
        "tags",
        "updated_at"
    ])

    return Response(
        {
            "message": "Post updated successfully.",
            "post": {
                "id": post.id,
                "title": post.title,
                "content": post.content,
                "tags": post.tags,
                "updated_at": post.updated_at
            }
        },
        status=status.HTTP_200_OK
    )

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_post(request, post_id):

    persona = request.user.profile.active_persona

    if not persona:
        return Response(
            {
                "error": "No active persona selected."
            },
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        post = Post.objects.get(
            id=post_id,
            is_removed=False
        )

    except Post.DoesNotExist:
        return Response(
            {
                "error": "Post not found."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    # -------------------------
    # Ownership Check
    # -------------------------

    if post.author != persona:
        return Response(
            {
                "error": "You can only delete your own posts."
            },
            status=status.HTTP_403_FORBIDDEN
        )

    # -------------------------
    # Soft Delete
    # -------------------------

    post.is_removed = True
    post.save(update_fields=["is_removed"])

    # -------------------------
    # Update Profile Counter
    # -------------------------

    profile = request.user.profile

    if profile.posts_count > 0:
        profile.posts_count -= 1
        profile.save(update_fields=["posts_count"])

    return Response(
        {
            "message": "Post deleted successfully."
        },
        status=status.HTTP_200_OK
    )

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def upload_media(request, post_id):

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

    # -------------------------
    # Ownership Check
    # -------------------------

    if post.author != persona:
        return Response(
            {"error": "You can only upload media to your own posts."},
            status=status.HTTP_403_FORBIDDEN
        )

    # -------------------------
    # Files Validation
    # -------------------------

    files = request.FILES.getlist("media")

    if not files:
        return Response(
            {"error": "No media files uploaded."},
            status=status.HTTP_400_BAD_REQUEST
        )

    uploaded_media = []

    for index, file in enumerate(files):

        content_type = file.content_type

        if content_type.startswith("image"):
            media_type = PostMedia.IMAGE

        elif content_type.startswith("video"):
            media_type = PostMedia.VIDEO

        else:
            return Response(
                {
                    "error": f"{file.name} is not a supported media type."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        media = PostMedia.objects.create(
            post=post,
            file=file,
            media_type=media_type,
            order=index
        )

        uploaded_media.append({
            "id": media.id,
            "type": media.media_type,
            "url": request.build_absolute_uri(media.file.url)
        })

    # -------------------------
    # Update Post Type
    # -------------------------

    media_types = set(
        post.media.values_list(
            "media_type",
            flat=True
        )
    )

    if media_types == {"IMAGE"}:
        post.post_type = Post.IMAGE

    elif media_types == {"VIDEO"}:
        post.post_type = Post.VIDEO

    else:
        post.post_type = Post.MIXED

    post.save(update_fields=["post_type"])

    return Response(
        {
            "message": "Media uploaded successfully.",
            "media": uploaded_media
        },
        status=status.HTTP_201_CREATED
    )

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_media(request, media_id):

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
    # Fetch Media
    # -------------------------

    try:
        media = PostMedia.objects.select_related(
            "post",
            "post__author"
        ).get(id=media_id)

    except PostMedia.DoesNotExist:
        return Response(
            {"error": "Media not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    post = media.post

    # -------------------------
    # Ownership Check
    # -------------------------

    if post.author != persona:
        return Response(
            {"error": "You can only delete media from your own posts."},
            status=status.HTTP_403_FORBIDDEN
        )

    # -------------------------
    # Delete File + Record
    # -------------------------

    media.file.delete(save=False)
    media.delete()

    # -------------------------
    # Update Post Type
    # -------------------------

    media_types = set(
        post.media.values_list(
            "media_type",
            flat=True
        )
    )

    if not media_types:
        post.post_type = Post.TEXT

    elif media_types == {"IMAGE"}:
        post.post_type = Post.IMAGE

    elif media_types == {"VIDEO"}:
        post.post_type = Post.VIDEO

    else:
        post.post_type = Post.MIXED

    post.save(update_fields=["post_type"])

    return Response(
        {
            "message": "Media deleted successfully.",
            "post_type": post.post_type
        },
        status=status.HTTP_200_OK
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_comment(request, post_id):

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

    content = request.data.get("content", "").strip()
    parent_comment_id = request.data.get("parent_comment")

    if not content:
        return Response(
            {"error": "Comment cannot be empty."},
            status=status.HTTP_400_BAD_REQUEST
        )

    parent_comment = None

    # -------------------------
    # Reply Support
    # -------------------------
    if parent_comment and parent_comment.parent_comment:
        return Response(
        {"error": "Replies to replies are not allowed."},
        status=status.HTTP_400_BAD_REQUEST
    )

    if parent_comment_id:

        try:
            parent_comment = Comment.objects.get(
                id=parent_comment_id,
                post=post,
                is_removed=False
            )

        except Comment.DoesNotExist:
            return Response(
                {"error": "Parent comment not found."},
                status=status.HTTP_404_NOT_FOUND
            )

    # -------------------------
    # Create Comment
    # -------------------------

    comment = Comment.objects.create(
        post=post,
        author=persona,
        content=content,
        parent_comment=parent_comment
    )

    # -------------------------
    # Update Counter
    # -------------------------

    post.comment_count += 1
    post.save(update_fields=["comment_count"])

    return Response(
        {
            "message": "Comment added successfully.",

            "comment": {
                "id": comment.id,
                "author": {
                    "id": persona.id,
                    "name": persona.name,
                    "avatar": (
                        request.build_absolute_uri(persona.avatar.url)
                        if persona.avatar
                        else None
                    )
                },
                "content": comment.content,
                "parent_comment": (
                    parent_comment.id
                    if parent_comment
                    else None
                ),
                "created_at": comment.created_at
            }
        },
        status=status.HTTP_201_CREATED
    )

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_comment(request, comment_id):

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
    # Fetch Comment
    # -------------------------

    try:
        comment = Comment.objects.select_related(
            "post",
            "author"
        ).get(
            id=comment_id,
            is_removed=False
        )

    except Comment.DoesNotExist:
        return Response(
            {"error": "Comment not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    # -------------------------
    # Ownership Check
    # -------------------------

    if comment.author != persona:
        return Response(
            {"error": "You can only delete your own comments."},
            status=status.HTTP_403_FORBIDDEN
        )

    # -------------------------
    # Soft Delete
    # -------------------------

    comment.is_removed = True
    comment.save(update_fields=["is_removed"])

    # -------------------------
    # Update Counter
    # -------------------------

    post = comment.post

    if post.comment_count > 0:
        post.comment_count -= 1
        post.save(update_fields=["comment_count"])

    return Response(
        {
            "message": "Comment deleted successfully."
        },
        status=status.HTTP_200_OK
    )

@api_view(["GET"])
def get_comments(request, post_id):

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
    # Top Level Comments
    # -------------------------

    comments = (
        Comment.objects
        .filter(
            post=post,
            parent_comment__isnull=True,
            is_removed=False
        )
        .select_related("author")
        .prefetch_related("replies__author")
        .order_by("-created_at")
    )

    data = []

    for comment in comments:

        replies = []

        for reply in comment.replies.filter(is_removed=False).order_by("created_at"):

            replies.append({

                "id": reply.id,

                "author": {
                    "id": reply.author.id,
                    "name": reply.author.name,

                    "avatar": (
                        request.build_absolute_uri(reply.author.avatar.url)
                        if reply.author.avatar
                        else None
                    )
                },

                "content": reply.content,
                "created_at": reply.created_at

            })

        data.append({

            "id": comment.id,

            "author": {
                "id": comment.author.id,
                "name": comment.author.name,

                "avatar": (
                    request.build_absolute_uri(comment.author.avatar.url)
                    if comment.author.avatar
                    else None
                )
            },

            "content": comment.content,
            "created_at": comment.created_at,
            "reply_count": len(replies),
            "replies": replies

        })

    return Response(
        {
            "count": len(data),
            "comments": data
        },
        status=status.HTTP_200_OK
    )