from django.db import models
from django.utils import timezone
from personas.models import Persona
from posts.models import Post
from accounts.models import User

class Interaction(models.Model):
    IMPRESSION = 'impression'
    CLICK = 'click'
    LIKE = 'like'
    INTERACTION_CHOICES = [
        (IMPRESSION, 'Impression'),
        (CLICK, 'Click'),
        (LIKE, 'Like'),
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
    interaction_type = models.CharField(max_length=20, choices=INTERACTION_CHOICES)
    created_at = models.DateTimeField(default=timezone.now)

    class Meta:
        indexes = [
            models.Index(fields=['post']),
            models.Index(fields=['persona']),
        ]

class Conversation(models.Model):
    created_at = models.DateTimeField(default=timezone.now)

class ConversationParticipant(models.Model):
    conversation = models.ForeignKey(
        Conversation, 
        on_delete=models.CASCADE, 
        related_name="participants"
    )
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name="conversations"
    )
    
    class Meta:
        unique_together = ('conversation', 'user')
        indexes = [
            models.Index(fields=['user']),
        ]

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
    created_at = models.DateTimeField(default=timezone.now)
    is_read = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=['conversation']),
            models.Index(fields=['sender']),
        ]

class SavedPost(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="saved_posts"
    )
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="saved_by_users"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'post')

class Repost(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="reposts"
    )
    original_post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name="reposted_by_users"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'original_post')