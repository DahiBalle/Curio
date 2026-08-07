import os
import django
import sys
import time

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from feed.views import generate_feed, GLOBAL_MODEL
from django.contrib.auth import get_user_model
from personas.models import Persona
from rest_framework.test import APIRequestFactory, force_authenticate
from posts.models import Post
from django.db.models import Q
from interactions.models import Interaction

p = Persona.objects.get(id=163)

# 1. Profile topics query
start = time.time()
persona_topics = p.personatopic_set.all()
broad_topic_ids = [pt.topic_id for pt in persona_topics]
narrow_topic_ids = [pt.topic_id for pt in persona_topics]
print("Topics query:", time.time() - start)

# 2. Profile candidates query setup
start = time.time()
candidates = Post.objects.filter(
    Q(broad_topic__in=broad_topic_ids) | Q(narrow_topic__in=narrow_topic_ids)
)
print("Candidates setup:", time.time() - start)

# 3. Profile seen posts
start = time.time()
seen_post_ids = list(Interaction.objects.filter(
    persona=p, 
    interaction_type='impression'
).values_list('post_id', flat=True))
print("Seen posts list:", time.time() - start)

# 4. Profile exclude and limit
start = time.time()
candidates = candidates.exclude(id__in=seen_post_ids).order_by('-created_at')[:1000]
print("Exclude setup:", time.time() - start)

# 5. Profile actual execution
start = time.time()
# Evaluate the queryset
candidate_list = list(candidates)
print("Query execution (fetching 1000 posts):", time.time() - start)

# 6. Profile full generate_feed
request = APIRequestFactory().get('/api/feed/?personaId=163&page=1')
force_authenticate(request, user=p.user)
start = time.time()
generate_feed(request)
print("generate_feed full:", time.time() - start)
