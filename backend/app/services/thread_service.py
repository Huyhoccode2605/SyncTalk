# backend/app/services/thread_service.py

from app.repositories.thread_repository import ThreadRepository
from app.repositories.like_repository import LikeRepository
from app.repositories.reply_repository import ReplyRepository
from app.repositories.notification_repository import NotificationRepository

thread_repo = ThreadRepository()
like_repo = LikeRepository()
reply_repo = ReplyRepository()
notif_repo = NotificationRepository()

class ThreadService:

    def create_thread(self, author_id, title, content, image_url=None):
        if not title or not content:
            return None, 'Title and content are required'
        thread = thread_repo.create(author_id, title, content, image_url)
        return thread, None

    def get_all_threads(self):
        threads = thread_repo.get_all()
        return threads, None

    def get_thread_by_id(self, thread_id):
        thread = thread_repo.find_by_id(thread_id)
        if not thread:
            return None, 'Thread not found'
        return thread, None

    def get_threads_by_author(self, author_id):
        threads = thread_repo.get_by_author(author_id)
        return threads, None

    def update_thread(self, thread_id, user_id, data):
        thread = thread_repo.find_by_id(thread_id)
        if not thread:
            return None, 'Thread not found'
        if thread.author_id != user_id:
            return None, 'Unauthorized'
        thread = thread_repo.update(thread_id, data)
        return thread, None

    def delete_thread(self, thread_id, user_id):
        thread = thread_repo.find_by_id(thread_id)
        if not thread:
            return None, 'Thread not found'
        if thread.author_id != user_id:
            return None, 'Unauthorized'
        thread_repo.delete(thread_id)
        return True, None

    def like_thread(self, user_id, thread_id):
        thread = thread_repo.find_by_id(thread_id)
        if not thread:
            return None, 'Thread not found'
        existing_like = like_repo.find(user_id, thread_id)
        if existing_like:
            return None, 'Already liked'
        like = like_repo.create(user_id, thread_id)
        thread_repo.increment_like_count(thread_id)
        if thread.author_id != user_id:
            notif_repo.create(
                user_id=thread.author_id,
                type='like',
                message='Someone liked your thread',
                reference_id=thread_id
            )
        return like, None

    def unlike_thread(self, user_id, thread_id):
        thread = thread_repo.find_by_id(thread_id)
        if not thread:
            return None, 'Thread not found'
        existing_like = like_repo.find(user_id, thread_id)
        if not existing_like:
            return None, 'Not liked yet'
        like_repo.delete(user_id, thread_id)
        thread_repo.decrement_like_count(thread_id)
        return True, None

    def create_reply(self, thread_id, author_id, content):
        thread = thread_repo.find_by_id(thread_id)
        if not thread:
            return None, 'Thread not found'
        if not content:
            return None, 'Content is required'
        reply = reply_repo.create(thread_id, author_id, content)
        thread_repo.increment_reply_count(thread_id)
        if thread.author_id != author_id:
            notif_repo.create(
                user_id=thread.author_id,
                type='reply',
                message='Someone replied to your thread',
                reference_id=thread_id
            )
        return reply, None

    def get_replies_by_thread(self, thread_id):
        thread = thread_repo.find_by_id(thread_id)
        if not thread:
            return None, 'Thread not found'
        replies = reply_repo.get_by_thread(thread_id)
        return replies, None

    def delete_reply(self, reply_id, user_id):
        reply = reply_repo.find_by_id(reply_id)
        if not reply:
            return None, 'Reply not found'
        if reply.author_id != user_id:
            return None, 'Unauthorized'
        reply_repo.delete(reply_id)
        return True, None