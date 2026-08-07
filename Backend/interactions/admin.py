from django.contrib import admin
from interactions.models import Interaction, Conversation, ConversationParticipant, Message, SavedPost, Repost

admin.site.register(Interaction)
admin.site.register(Conversation)
admin.site.register(ConversationParticipant)
admin.site.register(Message)
admin.site.register(SavedPost)
admin.site.register(Repost)