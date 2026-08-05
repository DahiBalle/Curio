from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from Backend.posts.models import Post
from Backend.accounts.models import Profile


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