import os
import django
import sys
import traceback

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from feed.views import generate_feed
from rest_framework.test import APIRequestFactory, force_authenticate
from django.contrib.auth import get_user_model

try:
    factory = APIRequestFactory()
    request = factory.get('/api/feed/?personaId=163&page=1')
    user = get_user_model().objects.first()
    force_authenticate(request, user=user)
    print("User:", user)
    response = generate_feed(request)
    print("Response status:", response.status_code)
    if hasattr(response, 'data'):
        print("Data keys:", response.data.keys())
except Exception as e:
    print("ERROR OCCURRED:")
    traceback.print_exc()
