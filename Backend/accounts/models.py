from django.db import models
from django.contrib.auth.models import AbstractUser

def banner_upload_path(instance, filename): pass
def profile_picture_upload_path(instance, filename): pass
def avatar_upload_path(instance, filename): pass

class User(AbstractUser):
    email = models.EmailField(unique=True)

    default_persona = models.ForeignKey(
        "personas.Persona",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="default_for_users"
    )

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    def __str__(self):
        return self.username

from django.utils import timezone

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
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        unique_together = ("follower", "following")
        indexes = [
            models.Index(fields=["follower"]),
            models.Index(fields=["following"]),
        ]

    def __str__(self):
        return f"{self.follower} -> {self.following}"