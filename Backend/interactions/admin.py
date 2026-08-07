from django.contrib import admin
from interactions.models import Interaction, SavedPost, Repost

admin.site.register(Interaction)
admin.site.register(SavedPost)
admin.site.register(Repost)