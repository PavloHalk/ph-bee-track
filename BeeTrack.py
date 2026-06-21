import webview
import sqlite3
import os
import sys
import json
from plyer import notification
from playsound import playsound

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
                                play_sound INTEGER default 0,
                                time_elapsed INTEGER default 0,
                                time_elapsed_total INTEGER default 0,
                                time_aim INTEGER default 144000,
                                is_deleted INTEGER default 0,
                                created_at TEXT)''')
                                
        conn.execute('''CREATE TABLE IF NOT EXISTS tracks
                                (id INTEGER PRIMARY KEY,
                                user_id INTEGER NOT NULL,
                                task_id INTEGER,
                                category_id INTEGER,
                                started_at TEXT,
                                stopped_at TEXT)''')
        conn.close()

    '''def execute_sql(self, query, params=()):
        """Runs an SQL query and returns data"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row # To get rows as dictionaries
                cursor = conn.execute(query, params)

                if query.strip().upper().startswith("SELECT"):
                    # Convert the result into a list of plain JS objects
                    return [dict(row) for row in cursor.fetchall()]
                else:
                    conn.commit()
                    return {"status": "success"}
        except Exception as e:
            return {"status": "error", "message": str(e)}'''
    
    def execute_sql(self, query, params=()):
        """Runs an SQL query and returns data or a status"""
        try:
            with sqlite3.connect(self.db_path) as conn:
                conn.row_factory = sqlite3.Row
                cursor = conn.execute(query, params)
                
                # Fetch data if there is any (for SELECT or RETURNING)
                # cursor.description is not None when the query returns something
                if cursor.description:
                    result = [dict(row) for row in cursor.fetchall()]
                else:
                    result = None
                
                conn.commit()
                
                if result is not None:
                    return result
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
    
    def save_config(self, data_json):
            with open("config.json", "w") as f:
                f.write(data_json)
            return "Збережено!"
    
    def load_config(self):
        if os.path.exists("config.json"):
            with open("config.json", "r") as f:
                return f.read()
        return "{}"

    def load_version(self):
        try:
            file_path = get_resource_path('version-app.json')
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
        except Exception:
            return "{}"
        
    def notify(self, title, message):
        notification.notify(
            title = title,
            message = message,
            app_name = 'BeeTrack',
            app_icon = get_resource_path('favicon.ico'),
            timeout = 15
        )

    def play_sound(self):
        playsound(get_resource_path('you-are-worked-to-hard.mp3'))

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
    width=1380,
    height=800,
    min_size=(900, 600),
    maximized=True,
    js_api=api
)

webview.start(http_server=True, debug=True, user_agent='pywebview-client')