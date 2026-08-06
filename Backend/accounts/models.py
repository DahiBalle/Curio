from django.db import models
from django.contrib.auth.models import AbstractUser

# -------------------------
# Authentication Model
# -------------------------

class User(AbstractUser):
    email = models.EmailField(unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.username


# -------------------------
# User Profile
# -------------------------

class Profile(models.Model):

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile"
    )

    display_name = models.CharField(
        max_length=100,
        blank=True
    )

    bio = models.TextField(
        max_length=300,
        blank=True
    )

    active_persona = models.ForeignKey(
    "personas.Persona",
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name="active_users"
    )

    profile_picture = models.ImageField(
        upload_to="profile_pictures/",
        default="defaults/profile.png",
        blank=True
    )

    banner = models.ImageField(
        upload_to="profile_banners/",
        default="defaults/banner.jpg",
        blank=True
    )

    website = models.URLField(blank=True)

    avatar_url = models.URLField(blank=True, null=True)
    banner_url = models.URLField(blank=True, null=True)

    date_of_birth = models.DateField(
        blank=True,
        null=True
    )

    is_private = models.BooleanField(
        default=False
    )

    is_verified = models.BooleanField(
        default=False
    )

    followers_count = models.PositiveIntegerField(
        default=0
    )

    following_count = models.PositiveIntegerField(
        default=0
    )

    posts_count = models.PositiveIntegerField(
        default=0
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    def __str__(self):
        return f"{self.user.username}'s Profile"


# -------------------------
# Follow System
# -------------------------

class Follow(models.Model):

    follower = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="following"
    )

    following = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="followers"
    )

    followed_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        unique_together = ("follower", "following")

    def __str__(self):
        return f"{self.follower} -> {self.following}"