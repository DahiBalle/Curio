from django.db import models
from personas.models import Persona
from posts.models import Post
from accounts.models import User

class Like(models.Model):

    persona = models.ForeignKey(
        Persona,
        on_delete=models.CASCADE,
        related_name="likes"
    )

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="likes"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("persona", "post")
        indexes = [
            models.Index(fields=["persona", "post"]),
        ]

    def __str__(self):
        return f"{self.persona.name} liked {self.post.title}"


class Save(models.Model):

    persona = models.ForeignKey(
        Persona,
        on_delete=models.CASCADE,
        related_name="saves"
    )

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="saves"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("persona", "post")
        indexes = [
            models.Index(fields=["persona", "post"]),
        ]

    def __str__(self):
        return f"{self.persona.name} saved {self.post.title}"


class Share(models.Model):

    persona = models.ForeignKey(
        Persona,
        on_delete=models.CASCADE,
        related_name="shares"
    )

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="shares"
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.persona.name} shared {self.post.title}"


class Interaction(models.Model):

    CLICK = "click"
    LIKE = "like"
    UNLIKE = "unlike"
    SAVE = "save"
    UNSAVE = "unsave"
    SHARE = "share"
    VIEW = "view"
    IMPRESSION = "impression"
    DWELL = "dwell"
    SKIP = "skip"

    INTERACTION_CHOICES = [
        (CLICK, "Click"),
        (LIKE, "Like"),
        (UNLIKE, "Unlike"),
        (SAVE, "Save"),
        (UNSAVE, "Unsave"),
        (SHARE, "Share"),
        (VIEW, "View"),
        (IMPRESSION, "Impression"),
        (DWELL, "Dwell"),
        (SKIP, "Skip"),
    ]

    persona = models.ForeignKey(
        Persona,
        on_delete=models.CASCADE,
        related_name="interactions"
    )

    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="interactions"
    )

    interaction_type = models.CharField(
        max_length=20,
        choices=INTERACTION_CHOICES
    )

    dwell_seconds = models.FloatField(
        null=True,
        blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=["persona", "created_at"]),
            models.Index(fields=["post", "interaction_type"]),
        ]

    def __str__(self):
        return f"{self.persona.name} -> {self.interaction_type} -> {self.post.title}"

class Conversation(models.Model):

    participants = models.ManyToManyField(
        User,
        related_name="conversations"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        names = ", ".join(u.username for u in self.participants.all())
        return f"Conversation({names})"


class Message(models.Model):

    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name="messages"
    )

    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sent_messages"
    )

    content = models.TextField()

    is_read = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["conversation", "created_at"]),
        ]

    def __str__(self):
        return f"{self.sender.username}: {self.content[:30]}"