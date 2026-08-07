from django.db import models
from django.utils import timezone
from pgvector.django import VectorField
from personas.models import Persona, Topic

def post_media_upload_path(instance, filename):
    return f"posts/{instance.post.id}/{filename}"

class Post(models.Model):
    author_persona = models.ForeignKey(
        Persona,
        on_delete=models.CASCADE,
        related_name="posts"
    )
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    contains_media = models.BooleanField(default=False)
    
    likes_count = models.IntegerField(default=0)
    clicks_count = models.IntegerField(default=0)
    impressions_count = models.IntegerField(default=0)
    
    embedding = VectorField(dimensions=384, null=True, blank=True)
    broad_topic = models.ForeignKey(
        Topic,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="broad_posts"
    )
    narrow_topic = models.ForeignKey(
        Topic,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="narrow_posts"
    )

    class Meta:
        indexes = [
            models.Index(fields=['author_persona']),
            models.Index(fields=['broad_topic', '-created_at']),
            models.Index(fields=['narrow_topic', '-created_at']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return self.title

class PostMedia(models.Model):
    IMAGE = 'image'
    VIDEO = 'video'
    MEDIA_TYPES = [
        (IMAGE, 'Image'),
        (VIDEO, 'Video'),
    ]

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="media"
    )
    file = models.FileField(upload_to=post_media_upload_path, null=True, blank=True)
    media_type = models.CharField(max_length=10, choices=MEDIA_TYPES)

    def __str__(self):
        return f"{self.media_type} for {self.post_id}"

class Comment(models.Model):
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="comments"
    )
    persona = models.ForeignKey(
        Persona,
        on_delete=models.CASCADE,
        related_name="comments"
    )
    parent_comment = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        related_name="replies",
        null=True,
        blank=True
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    likes_count = models.IntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=['post']),
            models.Index(fields=['parent_comment']),
        ]

    def __str__(self):
        return f"Comment by {self.persona.name} on {self.post_id}"