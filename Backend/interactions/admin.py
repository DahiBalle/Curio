from django.contrib import admin

# Register your models here.
 
from interactions.models import Like, Save, Share, Interaction, Conversation, Message

admin.site.register(Like)
admin.site.register(Save)
admin.site.register(Share)
admin.site.register(Interaction)
admin.site.register(Conversation)
admin.site.register(Message)