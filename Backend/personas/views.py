from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import json

from .models import Persona


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_persona(request):

    user = request.user

    name = request.data.get("name", "").strip()
    bio = request.data.get("bio", "").strip()
    allow_nsfw = request.data.get("allow_nsfw", False)

    # -------------------------
    # Validation
    # -------------------------

    if not name:
        return Response(
            {"error": "Persona name is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(name) > 50:
        return Response(
            {"error": "Persona name cannot exceed 50 characters."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # -------------------------
    # Duplicate Name Check
    # -------------------------

    if Persona.objects.filter(
        user=user,
        name__iexact=name
    ).exists():

        return Response(
            {"error": "You already have a persona with this name."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # -------------------------
    # Parse Interests
    # -------------------------

    interests_str = request.data.get("interests", "[]")
    try:
        interests = json.loads(interests_str)
        if not isinstance(interests, list):
            interests = []
    except json.JSONDecodeError:
        interests = []

    # -------------------------
    # Create Persona
    # -------------------------

    persona = Persona.objects.create(
        user=user,
        name=name,
        bio=bio,
        allow_nsfw=allow_nsfw,
        interests=interests
    )

    if "avatar" in request.FILES:
        persona.avatar = request.FILES["avatar"]
    
    if "banner" in request.FILES:
        persona.banner = request.FILES["banner"]

    persona.save()

    return Response(
        {
            "message": "Persona created successfully.",

            "persona": {
                "id": persona.id,
                "name": persona.name,
                "bio": persona.bio,
                "allow_nsfw": persona.allow_nsfw,
                "is_default": persona.is_default,
                "avatar": request.build_absolute_uri(persona.avatar.url) if persona.avatar else None,
                "banner": request.build_absolute_uri(persona.banner.url) if persona.banner else None,
                "interests": persona.interests,
                "created_at": persona.created_at
            }
        },
        status=status.HTTP_201_CREATED
    )


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_personas(request):

    personas = Persona.objects.filter(
        user=request.user
    ).order_by("-is_default", "name")

    active_persona = request.user.profile.active_persona

    data = []

    for persona in personas:

        data.append({
            "id": persona.id,
            "name": persona.name,
            "bio": persona.bio,

            "avatar": (
                request.build_absolute_uri(persona.avatar.url)
                if persona.avatar else None
            ),
            
            "banner": (
                request.build_absolute_uri(persona.banner.url)
                if persona.banner else None
            ),
            
            "interests": persona.interests,

            "allow_nsfw": persona.allow_nsfw,
            "is_default": persona.is_default,

            "is_active": (
                active_persona.id == persona.id
                if active_persona else False
            ),

            "created_at": persona.created_at
        })

    return Response(
        {
            "count": len(data),
            "personas": data
        },
        status=status.HTTP_200_OK
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def switch_persona(request):

    persona_id = request.data.get("persona_id")

    if not persona_id:
        return Response(
            {"error": "Persona ID is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        persona = Persona.objects.get(
            id=persona_id,
            user=request.user
        )

    except Persona.DoesNotExist:
        return Response(
            {"error": "Persona not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    profile = request.user.profile
    profile.active_persona = persona
    profile.save(update_fields=["active_persona"])

    return Response(
        {
            "message": "Active persona switched successfully.",
            "active_persona": {
                "id": persona.id,
                "name": persona.name
            }
        },
        status=status.HTTP_200_OK
    )

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Persona


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
def update_persona(request, persona_id):

    try:
        persona = Persona.objects.get(
            id=persona_id,
            user=request.user
        )

    except Persona.DoesNotExist:
        return Response(
            {"error": "Persona not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    name = request.data.get("name", persona.name).strip()
    bio = request.data.get("bio", persona.bio).strip()
    allow_nsfw = request.data.get(
        "allow_nsfw",
        persona.allow_nsfw
    )
    
    interests_str = request.data.get("interests")
    if interests_str is not None:
        import json
        try:
            if isinstance(interests_str, list):
                interests = interests_str
            else:
                interests = json.loads(interests_str)
            if not isinstance(interests, list):
                interests = persona.interests
        except (json.JSONDecodeError, TypeError):
            interests = persona.interests
    else:
        interests = persona.interests

    # -------------------------
    # Validation
    # -------------------------

    if not name:
        return Response(
            {"error": "Persona name is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(name) > 50:
        return Response(
            {"error": "Persona name cannot exceed 50 characters."},
            status=status.HTTP_400_BAD_REQUEST
        )

    duplicate = Persona.objects.filter(
        user=request.user,
        name__iexact=name
    ).exclude(id=persona.id)

    if duplicate.exists():
        return Response(
            {"error": "You already have another persona with this name."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # -------------------------
    # Update
    # -------------------------

    persona.name = name
    persona.bio = bio
    persona.allow_nsfw = allow_nsfw
    persona.interests = interests
    persona.save()

    return Response(
        {
            "message": "Persona updated successfully.",
            "persona": {
                "id": persona.id,
                "name": persona.name,
                "bio": persona.bio,
                "interests": persona.interests,
                "allow_nsfw": persona.allow_nsfw,
                "is_default": persona.is_default
            }
        },
        status=status.HTTP_200_OK
    )

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .models import Persona


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_persona(request, persona_id):

    try:
        persona = Persona.objects.get(
            id=persona_id,
            user=request.user
        )

    except Persona.DoesNotExist:
        return Response(
            {"error": "Persona not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    # -------------------------
    # Cannot delete default persona
    # -------------------------

    if persona.is_default:
        return Response(
            {"error": "Default persona cannot be deleted."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # -------------------------
    # Cannot delete active persona
    # -------------------------

    if request.user.profile.active_persona == persona:
        return Response(
            {"error": "Switch to another persona before deleting this one."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # -------------------------
    # Must keep at least one persona
    # -------------------------

    if Persona.objects.filter(user=request.user).count() <= 1:
        return Response(
            {"error": "At least one persona is required."},
            status=status.HTTP_400_BAD_REQUEST
        )

    persona.delete()

    return Response(
        {
            "message": "Persona deleted successfully."
        },
        status=status.HTTP_200_OK
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def active_persona(request):

    profile = request.user.profile

    if not profile.active_persona:
        return Response(
            {
                "error": "No active persona found."
            },
            status=status.HTTP_404_NOT_FOUND
        )

    persona = profile.active_persona

    return Response(
        {
            "active_persona": {
                "id": persona.id,
                "name": persona.name,
                "bio": persona.bio,

                "avatar": (
                    request.build_absolute_uri(persona.avatar.url)
                    if persona.avatar
                    else None
                ),
                
                "banner": (
                    request.build_absolute_uri(persona.banner.url)
                    if persona.banner else None
                ),
                
                "interests": persona.interests,

                "allow_nsfw": persona.allow_nsfw,
                "is_default": persona.is_default,
                "created_at": persona.created_at
            }
        },
        status=status.HTTP_200_OK
    )

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def interest_floor(request, persona_id):
    # Return empty list for now until model is implemented
    return Response([], status=status.HTTP_200_OK)
