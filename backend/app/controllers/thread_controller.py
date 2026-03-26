# backend/app/controllers/thread_controller.py

from flask import Blueprint, request
from app.services.thread_service import ThreadService
from app.utils.jwt_helper import token_required
from app.utils.response import success_response, error_response

thread_bp = Blueprint('thread', __name__, url_prefix='/api/threads')
thread_service = ThreadService()

@thread_bp.route('', methods=['GET'])
def get_all_threads():
    threads, error = thread_service.get_all_threads()
    if error:
        return error_response(error, 400)
    return success_response(
        data=[{
            'id': t.id,
            'author_id': t.author_id,
            'title': t.title,
            'content': t.content,
            'image_url': t.image_url,
            'reply_count': t.reply_count,
            'like_count': t.like_count,
            'is_pinned': t.is_pinned,
            'created_at': str(t.created_at)
        } for t in threads]
    )

@thread_bp.route('/<thread_id>', methods=['GET'])
def get_thread(thread_id):
    thread, error = thread_service.get_thread_by_id(thread_id)
    if error:
        return error_response(error, 404)
    return success_response(
        data={
            'id': thread.id,
            'author_id': thread.author_id,
            'title': thread.title,
            'content': thread.content,
            'image_url': thread.image_url,
            'reply_count': thread.reply_count,
            'like_count': thread.like_count,
            'is_pinned': thread.is_pinned,
            'created_at': str(thread.created_at)
        }
    )

@thread_bp.route('', methods=['POST'])
@token_required
def create_thread(current_user):
    data = request.get_json()
    if not data:
        return error_response('No data provided', 400)

    title = data.get('title')
    content = data.get('content')
    image_url = data.get('image_url')

    thread, error = thread_service.create_thread(current_user.id, title, content, image_url)
    if error:
        return error_response(error, 400)

    return success_response(
        data={
            'id': thread.id,
            'author_id': thread.author_id,
            'title': thread.title,
            'content': thread.content,
            'image_url': thread.image_url,
            'reply_count': thread.reply_count,
            'like_count': thread.like_count,
            'is_pinned': thread.is_pinned,
            'created_at': str(thread.created_at)
        },
        message='Thread created successfully',
        status_code=201
    )

@thread_bp.route('/<thread_id>', methods=['PUT'])
@token_required
def update_thread(current_user, thread_id):
    data = request.get_json()
    if not data:
        return error_response('No data provided', 400)

    thread, error = thread_service.update_thread(thread_id, current_user.id, data)
    if error:
        return error_response(error, 400)

    return success_response(
        data={
            'id': thread.id,
            'title': thread.title,
            'content': thread.content,
            'image_url': thread.image_url,
            'is_pinned': thread.is_pinned
        },
        message='Thread updated successfully'
    )

@thread_bp.route('/<thread_id>', methods=['DELETE'])
@token_required
def delete_thread(current_user, thread_id):
    result, error = thread_service.delete_thread(thread_id, current_user.id)
    if error:
        return error_response(error, 400)
    return success_response(message='Thread deleted successfully')

@thread_bp.route('/<thread_id>/like', methods=['POST'])
@token_required
def like_thread(current_user, thread_id):
    like, error = thread_service.like_thread(current_user.id, thread_id)
    if error:
        return error_response(error, 400)
    return success_response(message='Thread liked successfully')

@thread_bp.route('/<thread_id>/unlike', methods=['DELETE'])
@token_required
def unlike_thread(current_user, thread_id):
    result, error = thread_service.unlike_thread(current_user.id, thread_id)
    if error:
        return error_response(error, 400)
    return success_response(message='Thread unliked successfully')

@thread_bp.route('/<thread_id>/replies', methods=['GET'])
def get_replies(thread_id):
    replies, error = thread_service.get_replies_by_thread(thread_id)
    if error:
        return error_response(error, 404)
    return success_response(
        data=[{
            'id': r.id,
            'thread_id': r.thread_id,
            'author_id': r.author_id,
            'content': r.content,
            'created_at': str(r.created_at)
        } for r in replies]
    )

@thread_bp.route('/<thread_id>/replies', methods=['POST'])
@token_required
def create_reply(current_user, thread_id):
    data = request.get_json()
    if not data:
        return error_response('No data provided', 400)

    content = data.get('content')
    reply, error = thread_service.create_reply(thread_id, current_user.id, content)
    if error:
        return error_response(error, 400)

    return success_response(
        data={
            'id': reply.id,
            'thread_id': reply.thread_id,
            'author_id': reply.author_id,
            'content': reply.content,
            'created_at': str(reply.created_at)
        },
        message='Reply created successfully',
        status_code=201
    )

@thread_bp.route('/replies/<reply_id>', methods=['DELETE'])
@token_required
def delete_reply(current_user, reply_id):
    result, error = thread_service.delete_reply(reply_id, current_user.id)
    if error:
        return error_response(error, 400)
    return success_response(message='Reply deleted successfully')