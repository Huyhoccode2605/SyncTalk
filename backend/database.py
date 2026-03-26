import os
from flask_sqlalchemy import SQLAlchemy

from run import app

db =SQLAlchemy()

def init_db(app):

    database_url = os.getenv('DATABASE_URL')

    if database_url:
        app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    else:

        os.makedirs('instance', exist_ok=True)
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///instance/app.db'

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SQLALCHEMY_ECHO'] = False  # Tắt log SQL khi production

    # Khởi tạo db với Flask app
    db.init_app(app)
