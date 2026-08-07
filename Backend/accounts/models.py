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
