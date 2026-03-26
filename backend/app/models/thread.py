# backend/app/models/thread.py

import uuid
from datetime import datetime, timezone
from app import db

class Thread(db.Model):
    __tablename__ = 'threads'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    author_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String(300), nullable=True)
    reply_count = db.Column(db.Integer, default=0)
    like_count = db.Column(db.Integer, default=0)
    is_pinned = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    replies = db.relationship('Reply', backref='thread', lazy=True)
    likes = db.relationship('Like', backref='thread', lazy=True)
    thread_tags = db.relationship('ThreadTag', backref='thread', lazy=True)

    def __repr__(self):
        return f'<Thread {self.title}>'