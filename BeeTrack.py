import webview
import sqlite3
import os
import sys
import json

class DB_API:
    def __init__(self):
        self.db_path = "beetrack.db"
        self._setup_db()

    def _setup_db(self):
        # Створюємо таблицю, якщо її ще немає
        conn = sqlite3.connect(self.db_path)
        conn.execute('''CREATE TABLE IF NOT EXISTS logs 
                        (id INTEGER PRIMARY KEY, task TEXT, duration INTEGER, date TEXT)''')
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

api = DB_API()

# Correct getting file paths (important for exe)
def get_resource_path(relative_path):
    if hasattr(sys, '_MEIPASS'):
        return os.path.join(sys._MEIPASS, relative_path)
    return os.path.join(os.path.abspath("."), relative_path)

html_file = get_resource_path('index.html')

window = webview.create_window(
    'BeeTrack',
    html_file,
    width=1000,
    height=700,
    js_api=api
)

webview.start(http_server=True, debug=False, user_agent='pywebview-client')