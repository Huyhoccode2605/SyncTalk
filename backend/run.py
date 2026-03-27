# backend/run.py

import eventlet
eventlet.monkey_patch()  # BẮT BUỘC: Patch thư viện chuẩn để xử lý bất đồng bộ cho Database/Network

from dotenv import load_dotenv
from app import create_app, socketio

load_dotenv()

app = create_app()

@app.route('/api/synctalk-status', methods=['GET'])
def status():
    return {'status': 'ok'}

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5001, debug=True)