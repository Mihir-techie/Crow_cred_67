from flask import Blueprint, request, jsonify
from backend.app import db
from backend.models.post import Post, Comment, Like, SavedPost, Report, Block
from backend.models.user import User
from backend.utils.decorators import current_user_required

post_bp = Blueprint('post', __name__)

@post_bp.route('/create', methods=['POST'])
@current_user_required
def create_post(current_user_id):
    data = request.get_json()
    if not data or not data.get('content'):
        return jsonify({"message": "Content required"}), 400

    new_post = Post(
        user_id=current_user_id,
        content=data['content'],
        image_url=data.get('image_url')
    )
    db.session.add(new_post)
    db.session.commit()

    return jsonify({"message": "Post created", "post_id": new_post.id}), 201

@post_bp.route('/feed', methods=['GET'])
@current_user_required
def get_feed(current_user_id):
    blocked_by_me = db.session.query(Block.blocked_user_id).filter(
        Block.blocker_user_id == current_user_id
    )
    blocked_me = db.session.query(Block.blocker_user_id).filter(
        Block.blocked_user_id == current_user_id
    )

    posts = Post.query.filter(
        Post.is_deleted.is_(False),
        ~Post.user_id.in_(blocked_by_me),
        ~Post.user_id.in_(blocked_me)
    ).order_by(Post.created_at.desc()).all()

    result = []

    for p in posts:
        likes = Like.query.filter_by(post_id=p.id).all()
        comments = Comment.query.filter_by(post_id=p.id).order_by(Comment.created_at.asc()).all()
        saved = SavedPost.query.filter_by(post_id=p.id, user_id=current_user_id).first() is not None

        result.append({
            "id": p.id,
            "author_id": p.user_id,
            "author_name": p.author.name if p.author else "Unknown",
            "content": p.content,
            "image_url": p.image_url,
            "created_at": p.created_at.isoformat(),
            "updated_at": p.updated_at.isoformat() if p.updated_at else None,
            "likes": len(likes),
            "comments_count": len(comments),
            "liked_by_me": any(l.user_id == current_user_id for l in likes),
            "saved_by_me": saved,
            "is_owner": p.user_id == current_user_id,
            "comments": [
                {
                    "id": c.id,
                    "user_id": c.user_id,
                    "author_name": c.commented_by.name if c.commented_by else "Unknown",
                    "content": c.content,
                    "created_at": c.created_at.isoformat()
                }
                for c in comments
            ]
        })

    return jsonify(result), 200

@post_bp.route('/like', methods=['POST'])
@current_user_required
def like_post(current_user_id):
    data = request.get_json()
    post_id = data.get('post_id')
    
    if not post_id:
        return jsonify({"message": "post_id required"}), 400

    existing_like = Like.query.filter_by(post_id=post_id, user_id=current_user_id).first()
    if existing_like:
        db.session.delete(existing_like)
        db.session.commit()
        total_likes = Like.query.filter_by(post_id=post_id).count()
        return jsonify({"message": "Post unliked", "liked": False, "likes": total_likes}), 200

    new_like = Like(post_id=post_id, user_id=current_user_id)
    db.session.add(new_like)
    db.session.commit()
    total_likes = Like.query.filter_by(post_id=post_id).count()
    return jsonify({"message": "Post liked", "liked": True, "likes": total_likes}), 201

@post_bp.route('/comment', methods=['POST'])
@current_user_required
def comment_post(current_user_id):
    data = request.get_json()
    post_id = data.get('post_id')
    content = data.get('content')
    
    if not post_id or not content:
        return jsonify({"message": "post_id and content required"}), 400

    new_comment = Comment(post_id=post_id, user_id=current_user_id, content=content)
    db.session.add(new_comment)
    db.session.commit()

    return jsonify({"message": "Comment added", "comment_id": new_comment.id}), 201

@post_bp.route('/save', methods=['POST'])
@current_user_required
def save_post(current_user_id):
    data = request.get_json() or {}
    post_id = data.get('post_id')
    if not post_id:
        return jsonify({"message": "post_id required"}), 400

    saved = SavedPost.query.filter_by(post_id=post_id, user_id=current_user_id).first()
    if saved:
        db.session.delete(saved)
        db.session.commit()
        return jsonify({"message": "Post unsaved", "saved": False}), 200

    new_saved = SavedPost(post_id=post_id, user_id=current_user_id)
    db.session.add(new_saved)
    db.session.commit()
    return jsonify({"message": "Post saved", "saved": True}), 201

@post_bp.route('/<int:post_id>', methods=['DELETE'])
@current_user_required
def delete_post(current_user_id, post_id):
    post = Post.query.filter_by(id=post_id, user_id=current_user_id, is_deleted=False).first()
    if not post:
        return jsonify({"message": "Post not found or unauthorized"}), 404

    post.is_deleted = True
    db.session.commit()
    return jsonify({"message": "Post deleted"}), 200

@post_bp.route('/report', methods=['POST'])
@current_user_required
def report_post(current_user_id):
    data = request.get_json() or {}
    post_id = data.get('post_id')
    reason = (data.get('reason') or "").strip()

    if not post_id or not reason:
        return jsonify({"message": "post_id and reason required"}), 400

    post = Post.query.filter_by(id=post_id, is_deleted=False).first()
    if not post:
        return jsonify({"message": "Post not found"}), 404

    report = Report(user_id=current_user_id, post_id=post_id, reason=reason[:255])
    db.session.add(report)
    db.session.commit()
    return jsonify({"message": "Post reported"}), 201

@post_bp.route('/block-user', methods=['POST'])
@current_user_required
def block_user(current_user_id):
    data = request.get_json() or {}
    blocked_user_id = data.get('blocked_user_id')

    if not blocked_user_id:
        return jsonify({"message": "blocked_user_id required"}), 400
    if blocked_user_id == current_user_id:
        return jsonify({"message": "You cannot block yourself"}), 400

    target_user = User.query.filter_by(id=blocked_user_id).first()
    if not target_user:
        return jsonify({"message": "User not found"}), 404

    exists = Block.query.filter_by(
        blocker_user_id=current_user_id,
        blocked_user_id=blocked_user_id
    ).first()
    if exists:
        return jsonify({"message": "User already blocked"}), 200

    block = Block(blocker_user_id=current_user_id, blocked_user_id=blocked_user_id)
    db.session.add(block)
    db.session.commit()
    return jsonify({"message": "User blocked"}), 201

@post_bp.route('/leaderboard', methods=['GET'])
@current_user_required
def leaderboard(current_user_id):
    _ = current_user_id
    users = User.query.all()
    response = []
    for u in users:
        total_posts = Post.query.filter_by(user_id=u.id, is_deleted=False).count()
        total_likes = db.session.query(Like).join(Post, Like.post_id == Post.id).filter(
            Post.user_id == u.id,
            Post.is_deleted.is_(False)
        ).count()
        response.append({
            "user_id": u.id,
            "name": u.name,
            "posts": total_posts,
            "likes": total_likes,
            "score": (total_likes * 2) + total_posts
        })

    response.sort(key=lambda x: x["score"], reverse=True)
    for idx, row in enumerate(response):
        row["rank"] = idx + 1

    return jsonify(response[:20]), 200
