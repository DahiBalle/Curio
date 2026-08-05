from django.urls import path
from . import views

urlpatterns = [
    # CRUD for posts
    path("create/", views.create_post, name="create_post"),
    path("", views.list_posts, name="list_posts"),
    path("<int:post_id>/", views.post_detail, name="post_detail"),
    path("<int:post_id>/update/", views.update_post, name="update_post"),
    path("<int:post_id>/delete/", views.delete_post, name="delete_post"),

    # Likes
    path("<int:post_id>/like/", views.like_post, name="like_post"),
]
