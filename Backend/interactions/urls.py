from django.urls import path
from . import views

urlpatterns = [
    # Toggle Actions
    path("posts/<int:post_id>/vote/", views.vote_post, name="vote-post"),
    path("posts/<int:post_id>/save/", views.toggle_save, name="toggle-save"),
    path("posts/<int:post_id>/repost/", views.toggle_repost, name="toggle-repost"),

    # Tracking (feeds ML feedback loop)
    path("posts/<int:post_id>/click/", views.log_click, name="log-click"),
    path("posts/impression/", views.log_impression, name="log-impression"),
]