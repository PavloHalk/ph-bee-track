# BeeTrack
Desktop time tracker for busy bees 🐝

## Overview
BeeTrack is a lightweight desktop time-tracking app built with Python, [`pywebview`](https://pywebview.flowmaker.io/), and SQLite. A thin Python shell wraps an embedded web UI served from local HTML/CSS/JS assets; all data (users, projects, categories, tasks, and time tracks) lives in a local SQLite database. The frontend is plain, dependency-free HTML/CSS/JS (vanilla ES modules, no framework or build step) with only Bootstrap's CSS vendored locally.

In BeeTrack a user is affectionately called a **bee** ("бджілка") — that's the intended product wording throughout the UI.

## Key features
- **Task tracking** — start/stop per-task timers; elapsed time is recorded and persisted continuously.
- **Time goals** — each task has a target time; when it's reached BeeTrack fires a native desktop notification and (optionally) plays a looping alarm sound until you stop.
- **Task organization** — associate tasks with projects and categories, give them colors, and archive the ones you're done with.
- **Statistics** — detailed per-user stats including a yearly activity heat map, a weekly calendar, weekday distribution, and per-task totals.
- **Multiple bees** — create and switch between users; the last active bee is remembered between launches.
- **Multilingual UI** — 15 interface languages (Ukrainian is the default), switchable on the fly from the footer.
- **Native notifications** via [`plyer`](https://github.com/kivy/plyer) and alarm sound via [`playsound`](https://github.com/TaylorSMarks/playsound).
- **Single-file build** — package everything into one standalone Windows `.exe` with PyInstaller.

## App data and storage
- `beetrack.db` — local SQLite database, created automatically on first run.
- `config.json` — user settings (e.g. `last_logged_user_id`, selected `lang`).
- `version-app.json` — single source of truth for the app version and changelog.
- `index.html` — application shell loaded by `BeeTrack.py`.
- `css/`, `js/`, `html/`, `img/`, `lang/` — frontend assets (styles, scripts, HTML fragments, images, and per-language translation dictionaries).

## Architecture
- `BeeTrack.py` — the Python app and the entire `pywebview` bridge (`API` class exposed as `window.pywebview.api`); also owns the SQLite schema.
- `js/pyapi.js` — the only module that touches the bridge, wrapping each Python method (`execute_sql`, `load_html_content`, `save_config`, `load_config`, `load_version`, `notify`, `play_sound`) in a promise.
- `js/app.js` — app startup, routing, and user/session flow.
- `js/tplFunctions.js` — view switching (tasks, statistics, profile, …).
- `js/tpls/` — `TplXxx` view classes, each paired with an `html/xxx.html` fragment.
- `js/models/` — data models (`User.js`, `Task.js`, `Track.js`) that build SQL by hand.
- `js/Timer.js` — the running-task timer (persists progress, fires the goal notification/alarm).
- `js/i18n.js` + `lang/` — internationalization mechanics and per-language dictionaries.
- `BuildExe.py` — PyInstaller wrapper; also generates `version.txt` (`.exe` metadata) from `version-app.json`.

## Requirements
- Python 3.8+ recommended
- `pywebview`
- `plyer`
- `playsound`
- `pyinstaller` (only needed to build the executable)

## Install and run
1. Install dependencies:
   ```powershell
   pip install pywebview plyer playsound
   ```
2. Run the app:
   ```powershell
   python BeeTrack.py
   ```

## Build executable
To create a standalone Windows executable, run:
```powershell
pip install pyinstaller
python BuildExe.py
```
The output is placed in the `dist` folder if the build succeeds. `version.txt` (PyInstaller version metadata) is regenerated from `version-app.json` automatically as part of the build.

## Notes
- The required SQLite tables are created automatically on first run — there are no migrations; the schema lives in `BeeTrack.py`.
- There is no build step, bundler, or test suite for the frontend; the JS runs directly as native ES modules in the webview.

## License
Copyright © 2026 Pavlo Halkovsky.

Licensed under the [PolyForm Noncommercial License 1.0.0](https://polyformproject.org/licenses/noncommercial/1.0.0) — see the [`LICENSE`](LICENSE) file. You are free to use, modify, and share BeeTrack for any **noncommercial** purpose; commercial use (including selling or distributing it for profit) is not permitted. The author retains all copyright.
