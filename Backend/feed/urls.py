from django.urls import path
from . import views

urlpatterns = [
    path("", views.generate_feed, name="generate-feed"),
]
