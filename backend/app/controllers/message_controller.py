# backend/app/controllers/message_controller.py

from flask import Blueprint, request, jsonify
from app.services.message_service import MessageService
from app.utils.jwt_helper import token_required
from app.utils.response import success_response, error_response

message_bp = Blueprint('message', __name__, url_prefix='/api/messages')
message_service = MessageService()

@message_bp.route('/<receiver_id>', methods=['GET'])
@token_required
def get_conversation(current_user, receiver_id):
    messages, error = message_service.get_conversation(current_user.id, receiver_id)
    if error:
        return error_response(error, 404)
    return success_response(
        data=[{
            'id': m.id,
            'sender_id': m.sender_id,
            'receiver_id': m.receiver_id,
            'content': m.content,
            'image_url': m.image_url,
            'is_read': m.is_read,
            'created_at': str(m.created_at),
            'edited_at': str(m.edited_at) if m.edited_at else None
        } for m in messages]
    )

@message_bp.route('/<message_id>', methods=['PUT'])
@token_required
def edit_message(current_user, message_id):
    data = request.get_json()
    if not data:
        return error_response('No data provided', 400)

    content = data.get('content')
    message, error = message_service.edit_message(message_id, current_user.id, content)
    if error:
        return error_response(error, 400)

    return success_response(
        data={
            'id': message.id,
            'content': message.content,
            'edited_at': str(message.edited_at)
        },
        message='Message updated successfully'
    )

@message_bp.route('/<message_id>', methods=['DELETE'])
@token_required
def delete_message(current_user, message_id):
    result, error = message_service.delete_message(message_id, current_user.id)
    if error:
        return error_response(error, 400)
    return success_response(message='Message deleted successfully')

@message_bp.route('/unread', methods=['GET'])
@token_required
def get_unread(current_user):
    messages, error = message_service.get_unread_messages(current_user.id)
    if error:
        return error_response(error, 400)
    return success_response(
        data=[{
            'id': m.id,
            'sender_id': m.sender_id,
            'content': m.content,
            'created_at': str(m.created_at)
        } for m in messages]
    )

@message_bp.route('/read/<sender_id>', methods=['PUT'])
@token_required
def mark_as_read(current_user, sender_id):
    messages, error = message_service.mark_as_read(sender_id, current_user.id)
    if error:
        return error_response(error, 400)
    return success_response(message='Messages marked as read')


