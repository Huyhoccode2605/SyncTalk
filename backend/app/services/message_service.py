# backend/app/services/message_service.py

from app.repositories.message_repository import MessageRepository
from app.repositories.user_repository import UserRepository
from app.repositories.blocked_user_repository import BlockedUserRepository
from app.repositories.notification_repository import NotificationRepository

message_repo = MessageRepository()
user_repo = UserRepository()
blocked_repo = BlockedUserRepository()
notif_repo = NotificationRepository()

class MessageService:

    def send_message(self, sender_id, receiver_id, content, image_url=None):
        if not content and not image_url:
            return None, 'Content or image is required'

        receiver = user_repo.find_by_id(receiver_id)
        if not receiver:
            return None, 'Receiver not found'

        if blocked_repo.is_blocked(receiver_id, sender_id):
            return None, 'You are blocked by this user'

        message = message_repo.create(sender_id, receiver_id, content, image_url)

        notif_repo.create(
            user_id=receiver_id,
            type='message',
            message='You have a new message',
            reference_id=sender_id
        )

        return message, None

    def get_conversation(self, user1_id, user2_id):
        user = user_repo.find_by_id(user2_id)
        if not user:
            return None, 'User not found'
        messages = message_repo.get_conversation(user1_id, user2_id)
        return messages, None

    def get_unread_messages(self, receiver_id):
        messages = message_repo.get_unread(receiver_id)
        return messages, None

    def mark_as_read(self, sender_id, receiver_id):
        messages = message_repo.mark_as_read(sender_id, receiver_id)
        return messages, None

    def edit_message(self, message_id, user_id, content):
        message = message_repo.find_by_id(message_id)
        if not message:
            return None, 'Message not found'
        if message.sender_id != user_id:
            return None, 'Unauthorized'
        if not content:
            return None, 'Content is required'
        message = message_repo.update_content(message_id, content)
        return message, None

    def delete_message(self, message_id, user_id):
        message = message_repo.find_by_id(message_id)
        if not message:
            return None, 'Message not found'
        if message.sender_id != user_id:
            return None, 'Unauthorized'
        message_repo.delete(message_id)
        return True, None