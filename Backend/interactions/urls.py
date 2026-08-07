from django.urls import path
from . import views

urlpatterns = [
    # Toggle Actions
    path("posts/<int:post_id>/vote/", views.vote_post, name="vote-post"),
    path("posts/<int:post_id>/save/", views.toggle_save, name="toggle-save"),
    path("posts/<int:post_id>/repost/", views.toggle_repost, name="toggle-repost"),

    # Tracking (feeds ML feedback loop)
    path("posts/<int:post_id>/click/", views.log_click, name="log-click"),
    path("posts/<int:post_id>/impression/", views.log_impression, name="log-impression"),

    # Messenger
    path("messages/threads/", views.list_threads, name="list-threads"),
    path("messages/requests/", views.list_requests, name="list-requests"),
    path("messages/unread-count/", views.unread_count, name="unread-count"),
    path("messages/<str:thread_id>/", views.thread_messages, name="thread-messages"),
    path("messages/requests/<int:request_id>/accept/", views.accept_request, name="accept-request"),
    path("messages/requests/<int:request_id>/decline/", views.decline_request, name="decline-request"),
]