from flask_jwt_extended import jwt_required, get_jwt_identity
from functools import wraps
from flask import jsonify

def current_user_required(f):
    @jwt_required()
    @wraps(f)
    def decorated_function(*args, **kwargs):
        current_user_id = get_jwt_identity()
        if not current_user_id:
            return jsonify({"message": "Invalid token or user ID"}), 401
        try:
            current_user_id = int(current_user_id)
        except (TypeError, ValueError):
            return jsonify({"message": "Invalid token identity"}), 401
        return f(current_user_id, *args, **kwargs)
    return decorated_function
