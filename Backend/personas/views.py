from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from .models import Persona, Topic, PersonaTopic
from accounts.models import User

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def create_persona(request):
    name = request.data.get("name")
    bio = request.data.get("bio", "")
    avatar = request.FILES.get("avatar")
    banner = request.FILES.get("banner")

    if not name:
        return Response({"error": "Name required"}, status=400)

    persona = Persona.objects.create(
        user=request.user,
        name=name,
        bio=bio,
        avatar=avatar,
        banner=banner
    )

    interests = request.data.getlist("topics") if hasattr(request.data, "getlist") else request.data.get("topics", [])
    if isinstance(interests, str):
        interests = [interests]
    for t_name in interests:
        topic, _ = Topic.objects.get_or_create(name=t_name, defaults={'topic_type': Topic.BROAD})
        PersonaTopic.objects.get_or_create(persona=persona, topic=topic)

    return Response({
        "id": persona.id,
        "name": persona.name,
        "bio": persona.bio,
        "avatarUrl": request.build_absolute_uri(persona.avatar.url) if persona.avatar else None,
        "bannerUrl": request.build_absolute_uri(persona.banner.url) if persona.banner else None
    }, status=201)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_personas(request):
    username = request.query_params.get("username")
    if username:
        user = get_object_or_404(User, username__iexact=username)
    else:
        user = request.user

    personas = Persona.objects.filter(user=user)
    data = []
    for p in personas:
        data.append({
            "id": p.id,
            "title": p.name, # frontend calls it title
            "name": p.name,
            "bio": p.bio,
            "imageUrl": request.build_absolute_uri(p.avatar.url) if p.avatar else None,
            "avatarUrl": request.build_absolute_uri(p.avatar.url) if p.avatar else None,
            "bannerUrl": request.build_absolute_uri(p.banner.url) if p.banner else None
        })
    return Response({"personas": data})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def active_persona(request):
    persona = request.user.default_persona
    if not persona:
        return Response({"active_persona": None})
        
    posts_count = persona.posts.count()
    return Response({
        "active_persona": {
            "id": persona.id,
            "name": persona.name,
            "avatarUrl": request.build_absolute_uri(persona.avatar.url) if persona.avatar else None,
            "bannerUrl": request.build_absolute_uri(persona.banner.url) if persona.banner else None,
            "bio": persona.bio,
            "postsCount": str(posts_count)
        }
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def switch_persona(request):
    persona_id = request.data.get("persona_id")
    persona = get_object_or_404(Persona, id=persona_id, user=request.user)
    
    request.user.default_persona = persona
    request.user.save()
    
    return Response({"message": f"Switched to {persona.name}"})

@api_view(["PUT", "PATCH"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def update_persona(request, persona_id):
    persona = get_object_or_404(Persona, id=persona_id, user=request.user)
    
    name = request.data.get("name")
    bio = request.data.get("bio")
    avatar = request.FILES.get("avatar")
    banner = request.FILES.get("banner")

    if name:
        persona.name = name
    if bio is not None:
        persona.bio = bio
    if avatar:
        persona.avatar = avatar
    if banner:
        persona.banner = banner
        
    persona.save()
    return Response({"success": True})

@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
def delete_persona(request, persona_id):
    persona = get_object_or_404(Persona, id=persona_id, user=request.user)
    if request.user.default_persona == persona:
        return Response({"error": "Cannot delete active persona"}, status=400)
    persona.delete()
    return Response({"success": True})

@api_view(["GET"])
def interest_floor(request, persona_id):
    persona = get_object_or_404(Persona, id=persona_id)
    topics = persona.topics.all()
    
    data = []
    for t in topics:
        data.append({
            "id": t.id,
            "name": t.name,
            "avatarUrl": None # Topic doesn't have avatar yet, default to None
        })
    return Response(data)

@api_view(["GET"])
def get_topics(request):
    broad_topics = Topic.objects.filter(topic_type=Topic.BROAD)
    data = []
    for bt in broad_topics:
        narrow_topics = [{"id": str(nt.id), "name": nt.name} for nt in bt.subtopics.all()]
        data.append({
            "id": str(bt.id),
            "name": bt.name,
            "subtopics": narrow_topics
        })
    return Response(data)
