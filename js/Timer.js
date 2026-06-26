import Task from './models/Task.js';
import Track from './models/Track.js';
import {osNotify, playSound} from './pyapi.js';
import {notifySuccess, secondsToParts, toSqlDateTime} from "./utils.js";
import { t } from './i18n.js';

export default class Timer {
    #task = null;
    #interval = null;
    #alarmInterval = null;
    #lastStartDate = null;
    #elapsedOnLastStart = 0;
    #elapsedTotalOnLastStart = 0;
    #taskNotified = false;
    #track = null;

    setTask(task) {
        if (!(task instanceof Task)) throw new TypeError('Timer requires an instance of Task.');

        // Switching to another task stops the one currently running; its buttons are
        // synced back to the stopped state across every view before we move on.
        if (this.#interval) this.stop();

        this.#task = task;
        this.#taskNotified = false;
        this.#renderHeader();
    }

    start() {
        if (this.#interval || !this.#task) return;

        this.#lastStartDate = new Date();
        this.#elapsedOnLastStart = this.#task.timeElapsed;
        this.#elapsedTotalOnLastStart = this.#task.timeElapsedTotal;
        this.#interval = setInterval(this.#tick.bind(this), 1000);

        this.#track = new Track();
        this.#track.userId = this.#task.userId;
        this.#track.taskId = this.#task.id;
        this.#track.startedAt = toSqlDateTime();
        this.#track.stoppedAt = toSqlDateTime();

        // Paint the header from the current task and flip every view to the running state.
        this.#renderHeader();

        notifySuccess(
            t('timer.started.title'),
            t('timer.started.message', { name: this.#task.taskName })
        );
    }

    stop() {
        if (!this.#interval) return;

        clearInterval(this.#interval);
        this.#interval = null;

        // Captured locally so a concurrent setTask() reassigning #task/#track does
        // not affect the final writes or the refresh dispatched once they land.
        const task = this.#task;
        const track = this.#track;
        track.stoppedAt = toSqlDateTime();

        const taskSaved = task.save();
        const trackSaved = track.save();

        this.#track = null;

        // Silence any audible alarm and drop its overlay in every view.
        this.dismissAlarm();
        // Sync the buttons back to the stopped state while #task is still set — the
        // task stays in the header so the bee can resume tracking it later.
        this.#syncButtons(false);

        notifySuccess(
            t('timer.stopped.title'),
            t('timer.stopped.message', { name: task.taskName })
        );

        // Once the final writes have committed, let an open stats page refresh so
        // it shows the just-finalized data.
        Promise.all([taskSaved, trackSaved]).then(() => {
            document.dispatchEvent(new CustomEvent('timer-stopped'));
        });
    }

    // Whether the timer is currently counting (a task is being tracked).
    isRunning() {
        return !!this.#interval;
    }

    // Stop timing and drop the task from the header entirely (logout / bee switch).
    clear() {
        this.stop();
        this.#task = null;
        this.#taskNotified = false;

        document.querySelector('header .header-timer')?.classList.add('d-none');
    }

    // Remove the task from the header if it is the one shown there (e.g. archived).
    clearForTask(taskId) {
        if (this.#task && String(this.#task.id) === String(taskId)) this.clear();
    }

    // Reflect a reset (elapsed -> 0) in the header if it currently shows that task.
    resetHeaderClock(taskId) {
        if (!this.#task || String(this.#task.id) !== String(taskId)) return;
        this.#task.timeElapsed = 0;
        this.#renderHeader();
    }

    // Silence the looping alarm sound and hide its overlay across every view.
    dismissAlarm() {
        if (this.#alarmInterval) {
            clearInterval(this.#alarmInterval);
            this.#alarmInterval = null;
        }
        for (const view of this.#getViews()) {
            view.querySelector('.btn-stop-alarm')?.classList.add('d-none');
        }
    }

    #tick() {
        const diff = Math.floor(((new Date()) - this.#lastStartDate) / 1000);
        this.#task.timeElapsed = this.#elapsedOnLastStart + diff;
        this.#task.timeElapsedTotal = this.#elapsedTotalOnLastStart + diff;

        if (this.#task.timeElapsed % 5 === 0) {
            this.#task.save();

            this.#track.stoppedAt = toSqlDateTime();
            this.#track.save();
        }

        if (this.#task.timeElapsed > this.#task.timeAim && !this.#taskNotified) {
            this.#taskNotified = true;
            osNotify(
                'BeeTrack - ' + this.#task.taskName,
                t('timer.exceeded')
            );

            if (this.#task.playSound) {
                for (const view of this.#getViews()) {
                    view.querySelector('.btn-stop-alarm')?.classList.remove('d-none');
                }
                this.#alarmInterval = setInterval(() => {
                    playSound();
                }, 1600);
            }
        }

        this.#renderClocks();
    }

    // Build the list of DOM views mirroring the running task: the always-present header
    // widget plus the task card on the tasks page (only while that page is mounted).
    #getViews() {
        const views = [];

        const header = document.querySelector('header .header-timer');
        if (header) views.push(header);

        if (this.#task) {
            const card = document.querySelector('.task[data-task-id="' + this.#task.id + '"]');
            if (card) views.push(card);
        }

        return views;
    }

    // Toggle the Start/Stop buttons (and the card's active outline) in every view.
    #syncButtons(running) {
        for (const view of this.#getViews()) {
            view.querySelector('.btn-start')?.classList.toggle('disabled', running);
            view.querySelector('.btn-stop')?.classList.toggle('disabled', !running);
            // The active outline only exists on the task card.
            if (view.classList.contains('task')) view.classList.toggle('active', running);
        }
    }

    // Paint the header widget from the current task (color, name, clock, buttons).
    #renderHeader() {
        const header = document.querySelector('header .header-timer');
        if (!header || !this.#task) return;

        header.classList.remove('d-none');
        header.querySelector('.header-timer-color').style.backgroundColor = this.#task.color;
        const nameEl = header.querySelector('.header-timer-name');
        nameEl.innerText = this.#task.taskName;
        // Carries the active task id so the header name can open its report.
        nameEl.dataset.taskId = this.#task.id;
        this.#setClock(header.querySelector('.timer'), this.#task.timeElapsed);
        this.#syncButtons(!!this.#interval);
    }

    // Update the elapsed clock (and the card-only fields) across every view.
    #renderClocks() {
        for (const view of this.#getViews()) {
            this.#setClock(view.querySelector('.timer'), this.#task.timeElapsed);

            const timeLeft = view.querySelector('.time-left');
            if (timeLeft) {
                const tLeft = secondsToParts(Math.abs(this.#task.timeAim - this.#task.timeElapsed));
                const sign = this.#task.timeElapsed > this.#task.timeAim ? '-' : '';
                timeLeft.querySelector('.h').innerText = sign + tLeft.h.toString();
                timeLeft.querySelector('.m').innerText = tLeft.m.toString().padStart(2, '0');
                timeLeft.querySelector('.s').innerText = tLeft.s.toString().padStart(2, '0');
            }

            const percentage = view.querySelector('.clock-percentage .percentage');
            if (percentage) {
                percentage.innerText = (this.#task.timeElapsed / this.#task.timeAim * 100).toFixed(2);
            }
        }
    }

    #setClock(el, seconds) {
        const parts = secondsToParts(seconds);
        el.querySelector('.h').innerText = parts.h.toString();
        el.querySelector('.m').innerText = parts.m.toString().padStart(2, '0');
        el.querySelector('.s').innerText = parts.s.toString().padStart(2, '0');
    }
}
