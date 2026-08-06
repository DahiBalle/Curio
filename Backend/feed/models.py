from django.db import models

# Create your models here.
from django.db import models

from personas.models import Persona
from posts.models import Post


class FeedItem(models.Model):

    persona = models.ForeignKey(
        Persona,
        on_delete=models.CASCADE,
        related_name="feed_items"
    )

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="feed_items"
    )

    recommendation_score = models.FloatField(
        default=0
    )

    position = models.PositiveIntegerField(
        default=0
    )

    source = models.CharField(
        max_length=30,
        default="content_based"
    )

    served_at = models.DateTimeField(
        auto_now_add=True
    )

    is_clicked = models.BooleanField(
        default=False
    )

    is_seen = models.BooleanField(
        default=False
    )

    class Meta:
        ordering = ["position"]

    def __str__(self):
        return f"{self.persona.name} -> {self.post.id}"