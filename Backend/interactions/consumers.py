import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Conversation, Message, ConversationParticipant

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.thread_id = self.scope['url_route']['kwargs']['thread_id']
        self.room_group_name = f'chat_{self.thread_id}'
        self.user = self.scope['user']

        if self.user.is_anonymous:
            await self.close()
            return

        # Verify user is participant in conversation
        is_participant = await self.is_user_in_conversation(self.thread_id, self.user)
        if not is_participant:
            await self.close()
            return

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message_content = text_data_json.get('message')

        if not message_content:
            return

        # Save message to DB
        message = await self.save_message(self.thread_id, self.user, message_content)
        
        # Broadcast message to room group
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'id': message.id,
                'message': message.content,
                'senderId': self.user.id,
                'timestamp': message.created_at.strftime("%Y-%m-%dT%H:%M:%SZ")
            }
        )

    # Receive message from room group
    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'id': event['id'],
            'message': event['message'],
            'senderId': event['senderId'],
            'timestamp': event['timestamp']
        }))

    @database_sync_to_async
    def is_user_in_conversation(self, thread_id, user):
        try:
            # thread_id might be "thread-1" or "1", let's strip "thread-" if present
            if str(thread_id).startswith('thread-'):
                thread_id = str(thread_id).split('-')[1]
            conv = Conversation.objects.get(id=int(thread_id))
            return ConversationParticipant.objects.filter(conversation=conv, user=user).exists()
        except (Conversation.DoesNotExist, ValueError):
            return False

    @database_sync_to_async
    def save_message(self, thread_id, user, content):
        if str(thread_id).startswith('thread-'):
            thread_id = str(thread_id).split('-')[1]
        conv = Conversation.objects.get(id=int(thread_id))
        return Message.objects.create(
            conversation=conv,
            sender=user,
            content=content
        )
