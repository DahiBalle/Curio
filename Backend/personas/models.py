from django.db import models
from pgvector.django import VectorField

from Backend.accounts.models import User


class Persona(models.Model):

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="personas"
    )

    name = models.CharField(max_length=50)

    bio = models.TextField(blank=True, default="")

    avatar = models.ImageField(
        upload_to="persona_avatars/",
        blank=True,
        null=True
    )

    embedding = VectorField(
        dimensions=384,
        null=True,
        blank=True
    )

    allow_nsfw = models.BooleanField(default=False)

    is_default = models.BooleanField(default=False)

     

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return self.name