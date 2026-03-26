# backend/app/utils/jwt_helper.py

from functools import wraps
from flask import request, jsonify
from app.services.auth_service import AuthService

auth_service = AuthService()

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            parts = auth_header.split(' ')
            if len(parts) == 2 and parts[0] == 'Bearer':
                token = parts[1]

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        user, error = auth_service.verify_token(token)
        if error:
            return jsonify({'error': error}), 401

        return f(user, *args, **kwargs)
    return decorated