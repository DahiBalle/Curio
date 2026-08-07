from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path("auth/signup/", views.signup, name="signup"),
    path("auth/login/", views.login, name="login"),
    path("auth/me/", views.user_profile, name="user-profile"),
    
    # Onboarding
    path("accounts/check-username/", views.check_username, name="check-username"),
    path("accounts/onboarding/", views.onboarding, name="onboarding"),
    
    # Profile API
    path("profile/edit/", views.edit_profile, name="edit-profile"),
    path("profile/upload-picture/", views.upload_profile_picture, name="upload-profile-picture"),
    path("profile/upload-banner/", views.upload_banner, name="upload-banner"),
    path("profile/<str:username>/", views.user_profile_detail, name="user-profile-detail"),
    path("profile/<str:username>/posts/", views.user_profile_posts, name="user-profile-posts"),
    
    # Follow
    path("profile/<str:username>/follow/", views.follow_user, name="follow-user"),
    path("unfollow/<int:user_id>/", views.unfollow_user, name="unfollow-user"), # legacy fallback
    path("followers/<int:user_id>/", views.followers_list, name="followers-list"),
    path("following/<int:user_id>/", views.following_list, name="following-list"),
    
    # Search
    path("search/", views.search_users, name="search-users"),
]