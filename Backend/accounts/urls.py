from django.urls import path
from . import views

urlpatterns = [

    # Authentication
    path("api/signup/", views.signup, name="signup"),
    path("api/login/", views.login, name="login"),

    # Profile
    path("api/profile/", views.user_profile, name="user-profile"),
    path("api/profile/edit/", views.edit_profile, name="edit-profile"),
    path("api/profile/upload-picture/", views.upload_profile_picture, name="upload-profile-picture"),
    path("api/profile/upload-banner/", views.upload_banner, name="upload-banner"),

    # User Profiles
    path("api/profile/<int:user_id>/", views.user_profile_detail, name="user-profile-detail"),

    # Follow System
    path("api/follow/<int:user_id>/", views.follow_user, name="follow-user"),
    path("api/unfollow/<int:user_id>/", views.unfollow_user, name="unfollow-user"),
    path("api/followers/<int:user_id>/", views.followers_list, name="followers-list"),
    path("api/following/<int:user_id>/", views.following_list, name="following-list"),

    # Search
    path("api/search/", views.search_users, name="search-users"),
]