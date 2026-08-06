from django.db import models
from pgvector.django import VectorField


# =====================================
# Post Model
# =====================================

class Post(models.Model):

    PUBLIC = "PUBLIC"
    FOLLOWERS = "FOLLOWERS"
    PRIVATE = "PRIVATE"

    VISIBILITY_CHOICES = [
        (PUBLIC, "Public"),
        (FOLLOWERS, "Followers"),
        (PRIVATE, "Private"),
    ]

    TEXT = "TEXT"
    IMAGE = "IMAGE"
    VIDEO = "VIDEO"
    MIXED = "MIXED"

    POST_TYPES = [
        (TEXT, "Text"),
        (IMAGE, "Image"),
        (VIDEO, "Video"),
        (MIXED, "Mixed"),
    ]

    author = models.ForeignKey(
        "personas.Persona",
        on_delete=models.CASCADE,
        related_name="posts"
    )

    title = models.CharField(
        max_length=255
    )

    content = models.TextField()

    post_type = models.CharField(
        max_length=20,
        choices=POST_TYPES,
        default=TEXT
    )

    visibility = models.CharField(
        max_length=20,
        choices=VISIBILITY_CHOICES,
        default=PUBLIC
    )

    tags = models.CharField(
        max_length=255,
        blank=True
    )

    embedding = VectorField(
        dimensions=384,
        null=True,
        blank=True
    )

    like_count = models.PositiveIntegerField(
        default=0
    )

    comment_count = models.PositiveIntegerField(
        default=0
    )

    impression_count = models.PositiveIntegerField(default=0)

    share_count = models.PositiveIntegerField(
        default=0
    )

    save_count = models.PositiveIntegerField(
        default=0
    )

    view_count = models.PositiveIntegerField(
        default=0
    )

    is_nsfw = models.BooleanField(
        default=False
    )

    is_removed = models.BooleanField(
        default=False
    )

    is_reported = models.BooleanField(
        default=False
    )

    is_evergreen = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )



    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title


# =====================================
# Post Media
# =====================================

class PostMedia(models.Model):

    IMAGE = "IMAGE"
    VIDEO = "VIDEO"

    MEDIA_TYPES = [
        (IMAGE, "Image"),
        (VIDEO, "Video"),
    ]

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="media"
    )

    file = models.FileField(
        upload_to="posts/"
    )

    media_type = models.CharField(
        max_length=10,
        choices=MEDIA_TYPES
    )

    order = models.PositiveIntegerField(
        default=0
    )

    uploaded_at = models.DateTimeField(
        auto_now_add=True
    )

    class Meta:
        ordering = ["order"]

    def __str__(self):
        return f"{self.media_type} - {self.post.title}"


# =====================================
# Comments
# =====================================

class Comment(models.Model):

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="comments"
    )

    author = models.ForeignKey(
        "personas.Persona",
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

    is_removed = models.BooleanField(
        default=False
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"{self.author.name} - {self.post.title}"