#backend/run.py

from dotenv import load_dotenv
from app import create_app, socketio

from flask_socketio import SocketIO, emit

load_dotenv()

app = create_app()

@app.route('/api/synctalk-status', methods=['GET'])
def status():
    return {"status": "ok"}

@socketio.on('send_message')
def handle_message(data):
    print('May chu da nhan duoc tin:', data)
    emit('receive_message', data, broadcast=True)

if __name__ == '__main__':

    socketio.run(app, host='0.0.0.0', port=5001,  debug=True)