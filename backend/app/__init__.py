# backend/app/__init__.py

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_socketio import SocketIO

db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()
socketio = SocketIO()

def create_app():
    app = Flask(__name__)

    from config import Config
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    socketio.init_app(app, cors_allowed_origins="*", async_mode="eventlet")

    from app import models

    from app.controllers.auth_controller import auth_bp
    from app.controllers.thread_controller import thread_bp
    from app.controllers.message_controller import message_bp
    from app.controllers.notification_controller import notification_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(thread_bp)
    app.register_blueprint(message_bp)
    app.register_blueprint(notification_bp)

    from app.sockets import message_socket, notification_socket

    return app