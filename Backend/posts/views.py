from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Post

# ---------------- CREATE POST ----------------
@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_post(request):
    title = request.data.get("title")
    content = request.data.get("content")
    image = request.data.get("image")
    tags = request.data.get("tags")

    if not title or not content:
        return Response({"error": "Title and content are required"}, status=status.HTTP_400_BAD_REQUEST)

    post = Post.objects.create(
        author=request.user,
        title=title,
        content=content,
        image=image,
        tags=tags
    )
    return Response({"message": "Post created successfully", "post_id": post.id}, status=status.HTTP_201_CREATED)


# ---------------- LIST POSTS ----------------
@api_view(["GET"])
def list_posts(request):
    posts = Post.objects.all().order_by("-created_at")
    data = [
        {
            "id": post.id,
            "author": post.author.username,
            "title": post.title,
            "content": post.content,
            "tags": post.tags,
            "likes_count": post.likes.count(),
            "created_at": post.created_at,
        }
        for post in posts
    ]
    return Response(data, status=status.HTTP_200_OK)


# ---------------- POST DETAIL ----------------
@api_view(["GET"])
def post_detail(request, post_id):
    post = get_object_or_404(Post, id=post_id)
    data = {
        "id": post.id,
        "author": post.author.username,
        "title": post.title,
        "content": post.content,
        "tags": post.tags,
        "likes_count": post.likes.count(),
        "created_at": post.created_at,
        "updated_at": post.updated_at,
    }
    return Response(data, status=status.HTTP_200_OK)


# ---------------- UPDATE POST ----------------
@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)

    if post.author != request.user:
        return Response({"error": "You can only update your own posts"}, status=status.HTTP_403_FORBIDDEN)

    post.title = request.data.get("title", post.title)
    post.content = request.data.get("content", post.content)
    post.tags = request.data.get("tags", post.tags)
    post.image = request.data.get("image", post.image)
    post.save()

    return Response({"message": "Post updated successfully"}, status=status.HTTP_200_OK)


# ---------------- DELETE POST ----------------
@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)

    if post.author != request.user:
        return Response({"error": "You can only delete your own posts"}, status=status.HTTP_403_FORBIDDEN)

    post.delete()
    return Response({"message": "Post deleted successfully"}, status=status.HTTP_200_OK)


# ---------------- LIKE / UNLIKE POST ----------------
@api_view(["POST", "DELETE"])
@permission_classes([IsAuthenticated])
def like_post(request, post_id):
    post = get_object_or_404(Post, id=post_id)

    if request.method == "POST":
        post.likes.add(request.user)
        return Response({"message": "Post liked"}, status=status.HTTP_200_OK)

    elif request.method == "DELETE":
        post.likes.remove(request.user)
        return Response({"message": "Like removed"}, status=status.HTTP_200_OK)

