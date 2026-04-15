from backend.app import db
from datetime import datetime

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relationships
    courses = db.relationship('Course', backref='instructor', lazy=True)
    enrollments = db.relationship('Enrollment', backref='student', lazy=True)
    posts = db.relationship('Post', backref='author', lazy=True)
    post_likes = db.relationship('Like', backref='liked_by', lazy=True)
    post_comments = db.relationship('Comment', backref='commented_by', lazy=True)
    saved_posts = db.relationship('SavedPost', backref='saved_by_user', lazy=True)
    reports = db.relationship('Report', backref='reported_by', lazy=True)
    blocked_users = db.relationship(
        'Block',
        foreign_keys='Block.blocker_user_id',
        backref='blocker',
        lazy=True
    )
    blocked_by_users = db.relationship(
        'Block',
        foreign_keys='Block.blocked_user_id',
        backref='blocked_user',
        lazy=True
    )
    notifications = db.relationship('Notification', backref='user', lazy=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "created_at": self.created_at.isoformat()
        }
