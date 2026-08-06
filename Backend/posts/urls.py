from django.urls import path
from . import views

urlpatterns = [

    # Post Management
    path("create/", views.create_post, name="create-post"),
    path("", views.list_posts, name="list-posts"),
    path("<int:post_id>/", views.post_detail, name="post-detail"),
    path("<int:post_id>/update/", views.update_post, name="update-post"),
    path("<int:post_id>/delete/", views.delete_post, name="delete-post"),

    # Media
    path("<int:post_id>/media/upload/", views.upload_media, name="upload-media"),
    path("media/<int:media_id>/delete/", views.delete_media, name="delete-media"),

    # Comments
    path("<int:post_id>/comments/create/", views.create_comment, name="create-comment"),
    path("<int:post_id>/comments/", views.get_comments, name="get-comments"),
    path("comments/<int:comment_id>/delete/", views.delete_comment, name="delete-comment"),

]