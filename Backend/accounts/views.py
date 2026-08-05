from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Profile


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

    # -------------------------
    # Create User
    # -------------------------

    user = User.objects.create_user(
        username=username,
        email=email,
        password=password,
        first_name=first_name,
        last_name=last_name
    )

    # -------------------------
    # Create Profile
    # -------------------------

    Profile.objects.create(
        user=user,
        display_name=username
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
            }
        },
        status=status.HTTP_200_OK
    )