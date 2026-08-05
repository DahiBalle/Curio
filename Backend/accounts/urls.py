# urls.py
from django.urls import path   
from Backend.accounts.views import DeleteProfileView, LoginView, LogoutView, ProfileView, SignupView, UpdateProfileView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView  

urlpatterns = [
    path("api/login/", LoginView.as_view(), name="login"),
    path("api/logout/", LogoutView.as_view(), name="logout"),
    path("api/profile/", ProfileView.as_view(), name="profile"),
    path("api/signup/", SignupView.as_view(), name="signup"),
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/profile/update/", UpdateProfileView.as_view(), name="profile_update"),
    path("api/delete_account/", DeleteProfileView.as_view(), name="delete_account"),    
]
