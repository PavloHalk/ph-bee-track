# BeeTrack
Desktop time tracker for busy bees

## Overview
BeeTrack is a lightweight desktop time tracking app built with Python, `pywebview`, and SQLite. It uses an embedded web UI served from local HTML/CSS/JS assets and stores users, projects, categories, tasks, and time tracks in a local database.

## App data and storage
- `beetrack.db` — local SQLite database created automatically at runtime
- `config.json` — user settings file that stores app state such as `last_logged_user_id`
- `index.html` — main application shell loaded by `BeeTrack.py`
- `css/`, `js/`, `html/`, and `img/` — frontend assets used by the app UI

## Key features
- User management: create and select users
- Task tracking: start/stop task timers and record elapsed time
- Task metadata: associate tasks with projects and categories
- Persistent storage: tasks, tracks, users, categories, and projects persist in SQLite
- Native notifications using `plyer`
- Buildable as a single executable via `pyinstaller`

## Architecture
- `BeeTrack.py` — main Python app and `pywebview` bridge
- `js/pyapi.js` — JavaScript wrapper for Python API calls (`execute_sql`, `loadHtml`, `saveConfig`, `loadConfig`, `osNotify`)
- `js/app.js` — app startup logic and user/session flow
- `js/tplFunctions.js` — dynamic template rendering for views
- `js/models/` — app data models such as `User.js`, `Task.js`, `Track.js`
- `js/tpls/` — HTML template classes for UI screens
- `BuildExe.py` — helper script to package the app with PyInstaller
- `version.txt` — build version metadata (currently `0.1.1`)

## Requirements
- Python 3.8+ recommended
- `pywebview`
- `plyer`
- `pyinstaller` (for building the executable)

## Install and run
1. Install dependencies:
   ```powershell
   pip install pywebview plyer pyinstaller
   ```
2. Run the app:
   ```powershell
   python BeeTrack.py
   ```

## Build executable
To create a standalone Windows executable, run:
```powershell
python BuildExe.py
```
The output will be placed in the `dist` folder if the build succeeds.

## Notes
- The app automatically creates the required SQLite tables when first run.
- UI content is loaded from the `html/` folder and rendered in the webview window.
- Native desktop notifications are supported via `plyer.notification`.

## License
Update this section with your preferred license if needed.
