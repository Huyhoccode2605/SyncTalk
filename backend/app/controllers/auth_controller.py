# backend/app/controllers/auth_controller.py

from flask import Blueprint, request
from app.services.auth_service import AuthService
from app.utils.jwt_helper import token_required
from app.utils.response import success_response, error_response

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')
auth_service = AuthService()

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    if not data:
        return error_response('No data provided', 400)

    username = data.get('username')
    email = data.get('email')
    password = data.get('password')

    if not username or not email or not password:
        return error_response('Username, email and password are required', 400)

    user, error = auth_service.register(username, email, password)
    if error:
        return error_response(error, 409)

    return success_response(
        data={
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'profile_image_url': user.profile_image_url,
            'created_at': str(user.created_at)
        },
        message='User registered successfully',
        status_code=201
    )

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    if not data:
        return error_response('No data provided', 400)

    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return error_response('Email and password are required', 400)

    user, token, error = auth_service.login(email, password)
    if error:
        return error_response(error, 401)

    return success_response(
        data={
            'token': token,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'profile_image_url': user.profile_image_url,
                'is_online': user.is_online
            }
        },
        message='Login successful'
    )

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return success_response(
        data={
            'id': current_user.id,
            'username': current_user.username,
            'email': current_user.email,
            'profile_image_url': current_user.profile_image_url,
            'is_online': current_user.is_online,
            'created_at': str(current_user.created_at),
            'last_seen': str(current_user.last_seen)
        }
    )

@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.get_json()

    if not data:
        return error_response('No data provided', 400)

    user, error = auth_service.update_profile(current_user.id, data)
    if error:
        return error_response(error, 404)

    return success_response(
        data={
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'profile_image_url': user.profile_image_url
        },
        message='Profile updated successfully'
    )

@auth_bp.route('/users', methods=['GET'])
@token_required
def get_all_users(current_user):
    from app.repositories.user_repository import UserRepository
    user_repo = UserRepository()
    users = user_repo.get_all()
    return success_response(
        data=[{
            'id': u.id,
            'username': u.username,
            'email': u.email,
            'profile_image_url': u.profile_image_url,
            'is_online': u.is_online
        } for u in users if u.id != current_user.id]
    )