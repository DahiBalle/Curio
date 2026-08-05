import profile

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction
from django.shortcuts import get_object_or_404

from Backend.personas.models import Persona
from .models import User, Profile, Follow
from django.db.models import Q


@api_view(["POST"])
def signup(request):

    username = request.data.get("username")
    email = request.data.get("email")
    password = request.data.get("password")
    first_name = request.data.get("first_name", "")
    last_name = request.data.get("last_name", "")

    # -------------------------
    # Empty Field Validation
    # -------------------------

    if not username:
        return Response(
            {"error": "Username is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not email:
        return Response(
            {"error": "Email is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not password:
        return Response(
            {"error": "Password is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # -------------------------
    # Duplicate Username
    # -------------------------

    if User.objects.filter(username=username).exists():
        return Response(
            {"error": "Username already exists"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # -------------------------
    # Duplicate Email
    # -------------------------

    if User.objects.filter(email=email).exists():
        return Response(
            {"error": "Email already registered"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # -------------------------
    # Password Validation
    # -------------------------

    if len(password) < 8:
        return Response(
            {"error": "Password should contain at least 8 characters"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if password.isalpha() or password.isdigit():
        return Response(
            {"error": "Password must contain letters and numbers"},
            status=status.HTTP_400_BAD_REQUEST
        )

     # Create User
    user = User.objects.create_user(
    username=username,
    email=email,
    password=password,
    first_name=first_name,
    last_name=last_name
)

# Create Default Persona
    default_persona = Persona.objects.create(
    user=user,
    name=username,
    is_default=True
)

# Create Profile
    Profile.objects.create(
    user=user,
    display_name=username,
    active_persona=default_persona
)

    return Response(
        {
            "message": "Account created successfully",

            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "display_name": user.profile.display_name
            }
        },
        status=status.HTTP_201_CREATED
    )

@api_view(["PUT"])
def upload_profile_picture(request):

    profile = request.user.profile

    if "profile_picture" not in request.FILES:
        return Response(
            {"error": "No image uploaded"},
            status=400
        )

    profile.profile_picture = request.FILES["profile_picture"]
    profile.save()

    return Response(
        {
            "message": "Profile picture updated",
            "image": profile.profile_picture.url
        }
    )

@api_view(["PUT"])
def upload_banner(request):

    profile = request.user.profile

    if "banner" not in request.FILES:
        return Response(
            {"error": "No banner uploaded"},
            status=400
        )

    profile.banner = request.FILES["banner"]
    profile.save()

    return Response(
        {
            "message": "Banner updated",
            "banner": profile.banner.url
        }
    )



@api_view(["POST"])
def login(request):

    email = request.data.get("email")
    password = request.data.get("password")

    # -------------------------
    # Empty Field Validation
    # -------------------------

    if not email:
        return Response(
            {"error": "Email is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not password:
        return Response(
            {"error": "Password is required"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # -------------------------
    # Authenticate
    # -------------------------
    # USERNAME_FIELD is "email" on the User model, so authenticate()
    # takes username=email here — that's just how Django's auth backend
    # expects the kwarg, it isn't a mismatch.

    user = authenticate(request, username=email, password=password)

    if user is None:
        return Response(
            {"error": "Invalid email or password"},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # -------------------------
    # Deactivated Account Check
    # -------------------------

    if not user.is_active:
        return Response(
            {"error": "This account has been deactivated"},
            status=status.HTTP_403_FORBIDDEN
        )

    # -------------------------
    # Issue Tokens
    # -------------------------

    refresh = RefreshToken.for_user(user)

    # -------------------------
    # Basic Profile Info
    # -------------------------

    profile = user.profile

    return Response(
        {
            "message": "Login successful",
            "access": str(refresh.access_token),
            "refresh": str(refresh),
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "display_name": profile.display_name,
                "profile_picture": profile.profile_picture.url if profile.profile_picture else None,
                "is_verified": profile.is_verified,
            },
            "active_persona": {
            "id": profile.active_persona.id if profile.active_persona else None,
            "name": profile.active_persona.name if profile.active_persona else None,
}
        },
        status=status.HTTP_200_OK
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_profile(request):
    user = request.user
    profile = user.profile

    return Response(
        {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name,

            "active_persona": {
                "id": profile.active_persona.id if profile.active_persona else None,
                "name": profile.active_persona.name if profile.active_persona else None,
            },

            "profile": {
                "display_name": profile.display_name,
                "bio": profile.bio,
                "website": profile.website,
                "date_of_birth": profile.date_of_birth,

                "profile_picture": (
                    request.build_absolute_uri(profile.profile_picture.url)
                    if profile.profile_picture
                    else None
                ),

                "banner": (
                    request.build_absolute_uri(profile.banner.url)
                    if profile.banner
                    else None
                ),

                "is_private": profile.is_private,
                "is_verified": profile.is_verified,

                "followers": profile.followers_count,
                "following": profile.following_count,
                "posts": profile.posts_count,

                "created_at": profile.created_at,
            },
        },
        status=status.HTTP_200_OK,
    )

@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def edit_profile(request):

    user = request.user
    profile = user.profile

    # -------------------------
    # User Fields
    # -------------------------

    first_name = request.data.get("first_name")
    last_name = request.data.get("last_name")

    if first_name is not None:
        user.first_name = first_name.strip()

    if last_name is not None:
        user.last_name = last_name.strip()

    # -------------------------
    # Profile Fields
    # -------------------------

    display_name = request.data.get("display_name")
    bio = request.data.get("bio")
    website = request.data.get("website")
    date_of_birth = request.data.get("date_of_birth")
    is_private = request.data.get("is_private")

    if display_name is not None:
        profile.display_name = display_name.strip()

    if bio is not None:
        profile.bio = bio.strip()

    if website is not None:
        profile.website = website.strip()

    if date_of_birth:
        profile.date_of_birth = date_of_birth

    if is_private is not None:
        if isinstance(is_private, str):
            profile.is_private = is_private.lower() == "true"
        elif is_private is not None:
            profile.is_private = is_private
    # -------------------------
    # Save
    # -------------------------

    user.save()
    profile.save()

    return Response(
        {
            "message": "Profile updated successfully",

            "user": {
                "username": user.username,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "display_name": profile.display_name,
                "bio": profile.bio,
                "website": profile.website,
                "date_of_birth": profile.date_of_birth,
                "is_private": profile.is_private,
            }
        },
        status=status.HTTP_200_OK
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def follow_user(request, user_id):

    current_user = request.user

    # -------------------------
    # Cannot Follow Yourself
    # -------------------------

    if current_user.id == user_id:
        return Response(
            {"error": "You cannot follow yourself."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # -------------------------
    # User Exists?
    # -------------------------

    try:
        user_to_follow = User.objects.get(id=user_id)

    except User.DoesNotExist:
        return Response(
            {"error": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    # -------------------------
    # Already Following?
    # -------------------------

    if Follow.objects.filter(
        follower=current_user,
        following=user_to_follow
    ).exists():

        return Response(
            {"error": "You are already following this user."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # -------------------------
    # Follow User
    # -------------------------

    with transaction.atomic():

        Follow.objects.create(
            follower=current_user,
            following=user_to_follow
        )

        current_user.profile.following_count += 1
        current_user.profile.save(update_fields=["following_count"])

        user_to_follow.profile.followers_count += 1
        user_to_follow.profile.save(update_fields=["followers_count"])

    return Response(
        {
            "message": f"You are now following {user_to_follow.username}",
            "followers": user_to_follow.profile.followers_count
        },
        status=status.HTTP_201_CREATED
    )


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def unfollow_user(request, user_id):

    current_user = request.user

    # -------------------------
    # Cannot Unfollow Yourself
    # -------------------------

    if current_user.id == user_id:
        return Response(
            {"error": "You cannot unfollow yourself."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # -------------------------
    # User Exists?
    # -------------------------

    try:
        user_to_unfollow = User.objects.get(id=user_id)

    except User.DoesNotExist:
        return Response(
            {"error": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    # -------------------------
    # Check Follow Relationship
    # -------------------------

    try:
        follow = Follow.objects.get(
            follower=current_user,
            following=user_to_unfollow
        )

    except Follow.DoesNotExist:
        return Response(
            {"error": "You are not following this user."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # -------------------------
    # Unfollow
    # -------------------------

    with transaction.atomic():

        follow.delete()

        current_user.profile.following_count = max(
        0,
        current_user.profile.following_count - 1
        )

        user_to_unfollow.profile.followers_count = max(
        0,
        user_to_unfollow.profile.followers_count - 1
        )

        current_user.profile.save(update_fields=["following_count"])
        user_to_unfollow.profile.save(update_fields=["followers_count"])

    return Response(
        {
            "message": f"You have unfollowed {user_to_unfollow.username}",
            "followers": user_to_unfollow.profile.followers_count
        },
        status=status.HTTP_200_OK
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def user_profile_detail(request, user_id):

    current_user = request.user

    user = get_object_or_404(User, id=user_id)

    profile = user.profile

    is_following = Follow.objects.filter(
        follower=current_user,
        following=user
    ).exists()

    is_followed_by = Follow.objects.filter(
        follower=user,
        following=current_user
    ).exists()

    return Response(
        {
            "id": user.id,
            "username": user.username,
            "first_name": user.first_name,
            "last_name": user.last_name,

            "profile": {
                "display_name": profile.display_name,
                "bio": profile.bio,
                "website": profile.website,
                "date_of_birth": profile.date_of_birth,

                "profile_picture": (
                    request.build_absolute_uri(profile.profile_picture.url)
                    if profile.profile_picture else None
                ),

                "banner": (
                    request.build_absolute_uri(profile.banner.url)
                    if profile.banner else None
                ),

                "followers": profile.followers_count,
                "following": profile.following_count,
                "posts": profile.posts_count,

                "is_private": profile.is_private,
                "is_verified": profile.is_verified,

                "joined": profile.created_at,
            },

            "relationship": {
                "is_me": current_user.id == user.id,
                "is_following": is_following,
                "is_followed_by": is_followed_by
            }
        },
        status=status.HTTP_200_OK
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def followers_list(request, user_id):

    try:
        user = User.objects.get(id=user_id)

    except User.DoesNotExist:
        return Response(
            {"error": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    followers = Follow.objects.filter(
        following=user
    ).select_related(
        "follower",
        "follower__profile"
    )

    data = []

    for follow in followers:

        follower = follow.follower
        profile = follower.profile

        is_following = Follow.objects.filter(
            follower=request.user,
            following=follower
        ).exists()

        data.append({
            "id": follower.id,
            "username": follower.username,
            "display_name": profile.display_name,

            "profile_picture": (
                request.build_absolute_uri(profile.profile_picture.url)
                if profile.profile_picture
                else None
            ),
            "active_persona": {
                "id": profile.active_persona.id if profile.active_persona else None,
                "name": profile.active_persona.name if profile.active_persona else None,
            },
            "is_verified": profile.is_verified,
            "is_following": is_following,
        })

    return Response(
        {
            "count": len(data),
            "followers": data
        },
        status=status.HTTP_200_OK
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def following_list(request, user_id):

    try:
        user = User.objects.get(id=user_id)

    except User.DoesNotExist:
        return Response(
            {"error": "User not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    following = Follow.objects.filter(
        follower=user
    ).select_related(
        "following",
        "following__profile"
    )

    # Users that the logged-in user follows
    following_ids = set(
        Follow.objects.filter(
            follower=request.user
        ).values_list("following_id", flat=True)
    )

    data = []

    for relation in following:

        followed_user = relation.following
        profile = followed_user.profile

        data.append(
            {
                "id": followed_user.id,
                "username": followed_user.username,
                "display_name": profile.display_name,

                "profile_picture": (
                    request.build_absolute_uri(profile.profile_picture.url)
                    if profile.profile_picture
                    else None
                ),
                "active_persona": {
                    "id": profile.active_persona.id if profile.active_persona else None,
                    "name": profile.active_persona.name if profile.active_persona else None,
                },

                "is_verified": profile.is_verified,

                "is_following": followed_user.id in following_ids
            }
        )

    return Response(
        {
            "count": len(data),
            "following": data
        },
        status=status.HTTP_200_OK
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def search_users(request):

    query = request.GET.get("q", "").strip()

    if not query:
        return Response(
            {"error": "Search query is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    users = User.objects.filter(
        Q(username__icontains=query) |
        Q(first_name__icontains=query) |
        Q(last_name__icontains=query) |
        Q(profile__display_name__icontains=query)
    ).select_related("profile").exclude(
        id=request.user.id
    )

    users = users.order_by("-profile__followers_count")[:20]

    following_ids = set(
        Follow.objects.filter(
            follower=request.user
        ).values_list("following_id", flat=True)
    )

    results = []

    for user in users:

        profile = user.profile

        results.append(
            {
                "id": user.id,
                "username": user.username,
                "display_name": profile.display_name,
                "first_name": user.first_name,
                "last_name": user.last_name,

                "profile_picture": (
                    request.build_absolute_uri(profile.profile_picture.url)
                    if profile.profile_picture
                    else None
                ),

                "is_verified": profile.is_verified,
                "followers": profile.followers_count,

                "is_following": user.id in following_ids
            }
        )

    return Response(
        {
            "count": len(results),
            "results": results
        },
        status=status.HTTP_200_OK
    )