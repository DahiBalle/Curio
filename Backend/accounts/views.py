import os
from django.db import transaction, IntegrityError
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.paginator import Paginator

from .models import User, Follow
from personas.models import Persona, Topic, PersonaTopic
from posts.models import Post

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

@api_view(["POST"])
def signup(request):
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response({"error": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

    base_username = email.split("@")[0][:20]
    username = base_username
    counter = 1
    while User.objects.filter(username__iexact=username).exists():
        username = f"{base_username}{counter}"
        counter += 1

    if User.objects.filter(email__iexact=email).exists():
        return Response({"error": "Email already registered"}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with transaction.atomic():
            user = User.objects.create_user(username=username, email=email, password=password)
            default_persona = Persona.objects.create(user=user, name=username)
            user.default_persona = default_persona
            user.save()
            
    except IntegrityError:
        return Response({"error": "Registration failed"}, status=status.HTTP_400_BAD_REQUEST)

    tokens = get_tokens_for_user(user)
    return Response({
        "message": "Account created successfully",
        "token": tokens['access'],
        "user": {
            "username": user.username,
            "email": user.email,
            "onboardingComplete": False
        }
    }, status=status.HTTP_201_CREATED)

@api_view(["POST"])
def login(request):
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response({"error": "Email and password are required"}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(request, username=email, password=password)
    if user is None:
        return Response({"error": "Invalid email or password"}, status=status.HTTP_401_UNAUTHORIZED)
    if not user.is_active:
        return Response({"error": "Account deactivated"}, status=status.HTTP_403_FORBIDDEN)

    tokens = get_tokens_for_user(user)
    
    return Response({
        "message": "Login successful",
        "token": tokens['access'],
        "user": {
            "username": user.username,
            "email": user.email,
            "onboardingComplete": bool(user.first_name) # simple heuristic
        }
    }, status=status.HTTP_200_OK)

@api_view(["GET"])
def check_username(request):
    username = request.query_params.get("username")
    if not username:
        return Response({"error": "Username required"}, status=400)
    exists = User.objects.filter(username__iexact=username).exists()
    return Response({"available": not exists})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def onboarding(request):
    user = request.user
    username = request.data.get("username")
    name = request.data.get("name")
    avatar = request.FILES.get("avatar")
    
    # Check if username changed and is available
    if username and username.lower() != user.username.lower():
        if User.objects.filter(username__iexact=username).exists():
            return Response({"error": "Username taken"}, status=400)
        user.username = username

    if name:
        user.first_name = name  # Store display name here
        
    user.save()

    persona = user.default_persona
    if not persona:
        persona = Persona.objects.create(user=user, name=name or username)
        user.default_persona = persona
        user.save()
        
    if name:
        persona.name = name
    if avatar:
        persona.avatar = avatar
    
    # Process interests (topics)
    interests = request.data.getlist("interests") if hasattr(request.data, "getlist") else request.data.get("interests", [])
    if interests:
        if isinstance(interests, str):
            interests = [interests]
        for t_name in interests:
            topic, _ = Topic.objects.get_or_create(name=t_name, defaults={'topic_type': Topic.BROAD})
            PersonaTopic.objects.get_or_create(persona=persona, topic=topic)

    persona.save()

    return Response({
        "success": True,
        "profile": {
            "username": user.username,
            "name": persona.name,
        }
    }, status=201)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_profile(request):
    user = request.user
    return Response({
        "username": user.username,
        "email": user.email,
        "onboardingComplete": bool(user.first_name)
    })

@api_view(["PATCH"])
@permission_classes([IsAuthenticated])
def edit_profile(request):
    user = request.user
    persona = user.default_persona

    bio = request.data.get("bio")
    name = request.data.get("name")
    
    if bio is not None and persona:
        persona.bio = bio
    if name is not None and persona:
        persona.name = name
        user.first_name = name
        user.save()
        
    if persona:
        persona.save()

    return Response({
        "success": True,
        "profile": {
            "username": user.username,
            "name": persona.name if persona else "",
            "bio": persona.bio if persona else "",
        }
    })

@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def upload_profile_picture(request):
    persona = request.user.default_persona
    if not persona:
        return Response({"error": "No persona"}, status=400)
    if "profile_picture" in request.FILES:
        persona.avatar = request.FILES["profile_picture"]
        persona.save()
        return Response({"message": "Updated", "image": request.build_absolute_uri(persona.avatar.url)})
    return Response({"error": "No image"}, status=400)

@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def upload_banner(request):
    persona = request.user.default_persona
    if not persona:
        return Response({"error": "No persona"}, status=400)
    if "banner" in request.FILES:
        persona.banner = request.FILES["banner"]
        persona.save()
        return Response({"message": "Updated", "banner": request.build_absolute_uri(persona.banner.url)})
    return Response({"error": "No image"}, status=400)

@api_view(["GET"])
def user_profile_detail(request, username):
    user = get_object_or_404(User, username__iexact=username)
    persona = user.default_persona

    followers_count = Follow.objects.filter(following=user).count()
    following_count = Follow.objects.filter(follower=user).count()
    posts_count = Post.objects.filter(author_persona=persona).count() if persona else 0

    followed_by = []
    if request.user.is_authenticated:
        is_following = Follow.objects.filter(follower=request.user, following=user).exists()
    else:
        is_following = False

    return Response({
        "username": user.username,
        "name": persona.name if persona else user.username,
        "isVerified": False,
        "postsCount": str(posts_count),
        "followersCount": str(followers_count),
        "followingCount": str(following_count),
        "bio": persona.bio if persona else "",
        "hashtag": None,
        "link": None,
        "threadsUsername": None,
        "followedBy": followed_by,
        "followedByCount": followers_count,
        "avatarUrl": request.build_absolute_uri(persona.avatar.url) if (persona and persona.avatar) else None,
        "bannerUrl": request.build_absolute_uri(persona.banner.url) if (persona and persona.banner) else None,
        "isFollowing": is_following
    })

@api_view(["GET"])
def user_profile_posts(request, username):
    user = get_object_or_404(User, username__iexact=username)
    persona = user.default_persona
    if not persona:
        return Response({"posts": [], "page": 1, "totalPages": 1, "totalPosts": 0})

    posts_query = Post.objects.filter(author_persona=persona).order_by("-created_at")
    
    paginator = Paginator(posts_query, request.query_params.get("limit", 10))
    page_obj = paginator.get_page(request.query_params.get("page", 1))

    data = []
    for post in page_obj:
        first_topic = post.topics.first()
        topic_name = first_topic.name if first_topic else None
        
        media = post.media.first()
        media_url = request.build_absolute_uri(media.media_url) if (media and hasattr(media, 'media_url')) else None
        
        data.append({
            "id": f"post-{post.id}",
            "subreddit": topic_name,
            "author": f"u/{user.username}",
            "authorAvatar": request.build_absolute_uri(persona.avatar.url) if persona.avatar else None,
            "timeAgo": post.created_at.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "title": post.title,
            "description": post.description,
            "imageUrl": media_url,
            "upvotes": str(post.likes_count),
            "commentsCount": str(post.comment_set.count()) if hasattr(post, 'comment_set') else "0",
            "label": None,
            "type": media.media_type if media else "text"
        })

    return Response({
        "posts": data,
        "page": page_obj.number,
        "totalPages": paginator.num_pages,
        "totalPosts": paginator.count
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def follow_user(request, username):
    try:
        user_to_follow = User.objects.get(username__iexact=username)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=404)

    action = request.data.get("action", "follow")
    
    if action == "follow":
        if user_to_follow != request.user:
            Follow.objects.get_or_create(follower=request.user, following=user_to_follow)
            is_following = True
        else:
            is_following = False
    elif action == "unfollow":
        Follow.objects.filter(follower=request.user, following=user_to_follow).delete()
        is_following = False

    followers_count = Follow.objects.filter(following=user_to_follow).count()
    return Response({
        "isFollowing": is_following,
        "followersCount": str(followers_count)
    })

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def unfollow_user(request, user_id):
    try:
        user_to_unfollow = User.objects.get(id=user_id)
        Follow.objects.filter(follower=request.user, following=user_to_unfollow).delete()
    except User.DoesNotExist:
        return Response({"error": "Not found"}, status=404)
    return Response({"success": True})

@api_view(["GET"])
def followers_list(request, user_id):
    return Response([])

@api_view(["GET"])
def following_list(request, user_id):
    return Response([])

@api_view(["GET"])
def search_users(request):
    q = request.query_params.get("q", "")
    users = User.objects.filter(username__icontains=q)[:10]
    results = []
    for u in users:
        p = u.default_persona
        results.append({
            "resultType": "user",
            "id": u.username,
            "title": u.username,
            "snippet": p.bio if p else "",
            "imageUrl": request.build_absolute_uri(p.avatar.url) if (p and p.avatar) else None
        })
    return Response({"results": results, "page": 1, "totalResults": len(results)})