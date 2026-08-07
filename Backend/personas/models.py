from django.db import models
from pgvector.django import VectorField
import uuid

def avatar_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    return f"uploaded_images/{uuid.uuid4()}.{ext}"

def banner_upload_path(instance, filename):
    ext = filename.split('.')[-1]
    return f"uploaded_images/{uuid.uuid4()}.{ext}"

class Topic(models.Model):
    BROAD = 'broad'
    NARROW = 'narrow'
    TYPE_CHOICES = [
        (BROAD, 'Broad'),
        (NARROW, 'Narrow'),
    ]

    name = models.CharField(max_length=255, unique=True)
    topic_type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    parent = models.ForeignKey(
        'self', 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='subtopics'
    )

    def __str__(self):
        return self.name

class Persona(models.Model):
    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="personas"
    )
    name = models.CharField(max_length=255)
    bio = models.TextField(blank=True, null=True)
    
    avatar = models.ImageField(upload_to=avatar_upload_path, blank=True, null=True)
    banner = models.ImageField(upload_to=banner_upload_path, blank=True, null=True)
    
    embedding = VectorField(dimensions=384, null=True, blank=True)
    
    topics = models.ManyToManyField(Topic, through='PersonaTopic', related_name='personas')

    def __str__(self):
        return self.name

class PersonaTopic(models.Model):
    persona = models.ForeignKey(Persona, on_delete=models.CASCADE)
    topic = models.ForeignKey(Topic, on_delete=models.CASCADE)
    weight = models.FloatField(default=1.0)
    
    class Meta:
        unique_together = ('persona', 'topic')