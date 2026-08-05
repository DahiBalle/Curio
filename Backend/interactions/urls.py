from django.urls import path
from . import views

urlpatterns = [

    # Toggle Actions
    path("<int:post_id>/like/", views.toggle_like, name="toggle-like"),
    path("<int:post_id>/save/", views.toggle_save, name="toggle-save"),
    path("<int:post_id>/share/", views.share_post, name="share-post"),

    # Tracking (feeds ML feedback loop)
    path("<int:post_id>/view/", views.log_view, name="log-view"),
    path("impressions/", views.log_impressions, name="log-impressions"),
    path("<int:post_id>/log/", views.log_interaction, name="log-interaction"),

    # Persona History
    path("liked/", views.liked_posts, name="liked-posts"),
    path("saved/", views.saved_posts, name="saved-posts"),

    # Messenger
    path("messages/start/", views.start_conversation, name="start-conversation"),
    path("messages/", views.list_conversations, name="list-conversations"),
    path("messages/<int:conversation_id>/", views.conversation_messages, name="conversation-messages"),
    path("messages/<int:conversation_id>/send/", views.send_message, name="send-message"),
    path("messages/delete/<int:message_id>/", views.delete_message, name="delete-message"),

]