import Tpl from './Tpl.js';
import Track from '../models/Track.js';
import { t } from '../i18n.js';

export default class TplStatWeekCalendar extends Tpl {
    static HOURS = 24;
    static HOUR_H = 48;

    #userId = 0;
    #currentMonday = null;
    #cache = new Map();
    #includeArchived = false;

    static get htmlPath() {
        return 'stat-week-calendar';
    }

    get classAttr() {
        return 'tpl tpl-stat-week-calendar';
    }

    async init(userId, includeArchived = false) {
        this.#userId = userId;
        this.#includeArchived = includeArchived;
        this.#currentMonday = this.#getMondayOf(new Date());

        this.getElement().querySelector('.cal-prev').addEventListener('click', () => {
            this.#currentMonday.setDate(this.#currentMonday.getDate() - 7);
            this.#buildGrid();
        });
        this.getElement().querySelector('.cal-next').addEventListener('click', () => {
            this.#currentMonday.setDate(this.#currentMonday.getDate() + 7);
            this.#buildGrid();
        });
        this.getElement().querySelector('.cal-today').addEventListener('click', () => {
            this.#currentMonday = this.#getMondayOf(new Date());
            this.#buildGrid();
        });

        this.#buildGrid();
    }

    // Toggling archived: the cache becomes invalid, so clear it
    // and redraw the current week with a fresh request.
    async setIncludeArchived(value) {
        this.#includeArchived = value;
        this.#cache.clear();
        this.#buildGrid();
    }

    onLanguageChanged() {
        this.#buildGrid();
    }

    #buildGrid() {
        const dayNames = t('stats.week.days');
        const monthNames = t('stats.week.months');

        const grid = this.getElement().querySelector('.cal-grid');
        grid.innerHTML = '<div class="corner-cell"></div>';

        const weekDates = this.#getWeekDates(this.#currentMonday);
        const sunday = weekDates[6];

        const startLabel = `${this.#currentMonday.getDate()} ${monthNames[this.#currentMonday.getMonth()]}`;
        const endLabel = `${sunday.getDate()} ${monthNames[sunday.getMonth()]} ${sunday.getFullYear()}`;
        this.getElement().querySelector('.cal-week-label').textContent = `${startLabel} – ${endLabel}`;

        weekDates.forEach((date, i) => {
            const h = document.createElement('div');
            h.className = 'day-header' + (this.#isToday(date) ? ' today' : '');
            h.innerHTML = `<div class="day-name">${dayNames[i]}</div>`
                + `<div class="day-date">${date.getDate()}</div>`
                + `<div class="day-sub">${this.#pad(date.getDate())}.${this.#pad(date.getMonth() + 1)}</div>`;
            grid.appendChild(h);
        });

        const timeCol = document.createElement('div');
        timeCol.className = 'time-label-col';
        for (let h = 0; h <= TplStatWeekCalendar.HOURS; h++) {
            const lbl = document.createElement('div');
            lbl.className = 'time-label';
            lbl.textContent = h < 24 ? `${this.#pad(h)}:00` : '';
            timeCol.appendChild(lbl);
        }
        grid.appendChild(timeCol);

        weekDates.forEach((date, dayIdx) => {
            const col = document.createElement('div');
            col.className = 'day-col';
            col.style.height = (TplStatWeekCalendar.HOURS * TplStatWeekCalendar.HOUR_H) + 'px';

            const lines = document.createElement('div');
            lines.className = 'hour-lines';
            for (let h = 0; h < TplStatWeekCalendar.HOURS; h++) {
                const hl = document.createElement('div');
                hl.className = 'hour-line';
                lines.appendChild(hl);
            }
            col.appendChild(lines);

            const layer = document.createElement('div');
            layer.className = 'tasks-layer';
            layer.dataset.day = String(dayIdx);
            col.appendChild(layer);

            grid.appendChild(col);
        });

        this.#renderTasks(weekDates);
    }

    // Fetches tracks only for the displayed week. Already-loaded weeks
    // are cached, so returning to a viewed week makes no request.
    async #renderTasks(weekDates) {
        const monday = weekDates[0];
        const key = this.#weekKey(monday);

        let records = this.#cache.get(key);
        if (!records) {
            records = await Track.getWeekRecords(this.#userId, monday, this.#includeArchived);
            this.#cache.set(key, records);
        }

        // While waiting for the request, the user could have flipped further —
        // then the grid is already different and there is no need to draw.
        if (this.#weekKey(this.#currentMonday) !== key) return;

        const weekStart = monday.getTime();
        // Next local midnight after Sunday — DST-safe (a week is not always 7×24h).
        const weekEndDate = new Date(weekDates[6]);
        weekEndDate.setDate(weekEndDate.getDate() + 1);
        const weekEnd = weekEndDate.getTime();

        for (const rec of records) {
            const start = this.#parseUtc(rec.started_at);
            const stop = this.#parseUtc(rec.stopped_at);

            const from = Math.max(start, weekStart);
            const to = Math.min(stop, weekEnd);
            if (from >= to) continue;

            for (let i = 0; i < 7; i++) {
                const dayStart = weekDates[i].getTime();
                // Next local midnight — DST-safe (a day is not always 24h).
                const dayEndDate = new Date(weekDates[i]);
                dayEndDate.setDate(dayEndDate.getDate() + 1);
                const dayEnd = dayEndDate.getTime();

                const segFrom = Math.max(from, dayStart);
                const segTo = Math.min(to, dayEnd);
                if (segFrom >= segTo) continue;

                const fromMin = (segFrom - dayStart) / 60000;
                const toMin = (segTo - dayStart) / 60000;

                this.#addTask({
                    name: rec.task_name || t('stats.week.task'),
                    color: rec.task_color || '#6c757d',
                    dayIndex: i,
                    startHour: Math.floor(fromMin / 60),
                    startMin: Math.round(fromMin % 60),
                    endHour: Math.floor(toMin / 60),
                    endMin: Math.round(toMin % 60),
                });
            }
        }
    }

    #addTask(task) {
        const layer = this.getElement().querySelector(`.tasks-layer[data-day="${task.dayIndex}"]`);
        if (!layer) return;

        const startPx = (task.startHour + task.startMin / 60) * TplStatWeekCalendar.HOUR_H;
        const endPx = (task.endHour + task.endMin / 60) * TplStatWeekCalendar.HOUR_H;
        const height = Math.max(endPx - startPx, 6);

        const timeStr = `${this.#formatTime(task.startHour, task.startMin)} – ${this.#formatTime(task.endHour, task.endMin)}`;

        const block = document.createElement('div');
        block.className = 'task-block';
        block.style.top = startPx + 'px';
        block.style.height = height + 'px';
        block.style.background = task.color;
        block.style.color = task.textColor || '#fff';
        // Same as on the card (name + time) — so it is visible on short tracks,
        // where the text does not fit inside the block.
        block.title = `${task.name}\n${timeStr}`;
        block.innerHTML = `<div class="task-name">${task.name}</div>`
            + (height > 28 ? `<div class="task-time">${timeStr}</div>` : '');
        layer.appendChild(block);
    }

    #getMondayOf(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = day === 0 ? -6 : 1 - day;
        d.setDate(d.getDate() + diff);
        d.setHours(0, 0, 0, 0);
        return d;
    }

    #getWeekDates(monday) {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            return d;
        });
    }

    #isToday(d) {
        const n = new Date();
        return d.getDate() === n.getDate()
            && d.getMonth() === n.getMonth()
            && d.getFullYear() === n.getFullYear();
    }

    #weekKey(monday) {
        return `${monday.getFullYear()}-${this.#pad(monday.getMonth() + 1)}-${this.#pad(monday.getDate())}`;
    }

    #parseUtc(str) {
        return new Date(str.replace(' ', 'T') + 'Z').getTime();
    }

    #pad(n) {
        return String(n).padStart(2, '0');
    }

    #formatTime(h, m) {
        return `${this.#pad(h)}:${this.#pad(m)}`;
    }
}