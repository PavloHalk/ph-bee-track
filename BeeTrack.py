import webview
import sqlite3
import os
import sys
import json

class API:
    def __init__(self):
        self.db_path = "beetrack.db"
        self._setup_db()

    def _setup_db(self):
        conn = sqlite3.connect(self.db_path)
        conn.execute('''CREATE TABLE IF NOT EXISTS users
                        (id INTEGER PRIMARY KEY, username TEXT UNIQUE, created_at TEXT)''')
                        
        conn.execute('''CREATE TABLE IF NOT EXISTS projects
                        (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, name TEXT, description TEXT, color TEXT, created_at TEXT)''')
                        
        conn.execute('''CREATE TABLE IF NOT EXISTS categories
                                (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL, name TEXT, description TEXT, color TEXT, created_at TEXT)''')
                                
        conn.execute('''CREATE TABLE IF NOT EXISTS tasks
                                (id INTEGER PRIMARY KEY,
                                user_id INTEGER NOT NULL,
                                project_id INTEGER,
                                category_id INTEGER,
                                name TEXT,
                                description TEXT,
                                color TEXT,
                                created_at TEXT)''')
                                
        conn.execute('''CREATE TABLE IF NOT EXISTS tracks
                                (id INTEGER PRIMARY KEY,
                                user_id INTEGER NOT NULL,
                                task_id INTEGER,
                                category_id INTEGER,
                                started_at TEXT,
                                duration INTEGER)''')
        conn.close()

    def execute_sql(self, query, params=()):
        """Виконує SQL запит і повертає дані"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row # Щоб отримувати дані як словник
                cursor = conn.execute(query, params)
                
                if query.strip().upper().startswith("SELECT"):
                    # Перетворюємо результат у список звичайних об'єктів JS
                    return [dict(row) for row in cursor.fetchall()]
                else:
                    conn.commit()
                    return {"status": "success"}
        except Exception as e:
            return {"status": "error", "message": str(e)}
            
    def load_html_content(self, filename):
        try:
            file_path = get_resource_path(os.path.join('html', filename + '.html'))
            with open(file_path, 'r', encoding='utf-8') as f:
                return {"content": f.read(), "status": "success", "message": ""}
        except Exception as e:
            return {"content": "", "status": "error", "message": str(e)}


api = API()

# Correct getting file paths (important for exe)
def get_resource_path(relative_path):
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath("."), relative_path)

html_file = get_resource_path('index.html')

window = webview.create_window(
    'BeeTrack - трекер часу для зайнятих бджілок',
    html_file,
    width=1000,
    height=700,
    js_api=api
)

webview.start(http_server=True, debug=True, user_agent='pywebview-client')