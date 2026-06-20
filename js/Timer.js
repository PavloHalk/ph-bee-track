import Task from './models/Task.js';
import Track from './models/Track.js';
import {osNotify, playSound} from './pyapi.js';
import {notifySuccess, secondsToParts, toSqlDateTime} from "./utils.js";
import { t } from './i18n.js';

export default class Timer {
    #task = null;
    #taskEl = null;
    #interval = null;
    #alarmInterval = null;
    #lastStartDate = null;
    #elapsedOnLastStart = 0;
    #elapsedTotalOnLastStart = 0;
    #taskNotified = false;
    #track = null;
    
    setTask(task) {
        if (!(task instanceof Task)) throw new TypeError('Timer requires an instance of Task.');
        
        if (this.#task) {
            // Stop the previous task only if it is actually present in the DOM
            // (otherwise it is a task from a past session — after logout/switching the bee
            // its element is gone, and there is nothing to stop).
            const prevStopBtn = document.querySelector('.task[data-task-id="'+this.#task.id+'"] .btn-stop');
            if (prevStopBtn) {
                const click = new Event('click', { bubbles: true, cancelable: true });
                prevStopBtn.dispatchEvent(click);
            }
        }
        
        this.#task = task;
        this.#taskNotified = false;
    }
    
    start() {
        if (this.#interval || !this.#task) return;

        this.#lastStartDate = new Date();
        this.#elapsedOnLastStart = this.#task.timeElapsed;
        this.#elapsedTotalOnLastStart = this.#task.timeElapsedTotal;
        this.#taskEl = document.querySelector('.task[data-task-id="'+this.#task.id+'"]');
        this.#interval = setInterval(this.#tick.bind(this), 1000);
        
        this.#track = new Track();
        this.#track.userId = this.#task.userId;
        this.#track.taskId = this.#task.id;
        this.#track.startedAt = toSqlDateTime();
        this.#track.stoppedAt = toSqlDateTime();
        
        notifySuccess(
            t('timer.started.title'),
            t('timer.started.message', { name: this.#task.taskName })
        );
    }
    
    stop() {
        if (!this.#interval) return;

        clearInterval(this.#interval);
        this.#interval = null;

        this.#task.save();

        this.#track.stoppedAt = toSqlDateTime();
        this.#track.save();

        this.#track = null;

        // Stop the audible alarm and hide its button, so the signal does not keep
        // sounding after the task is stopped or the profile is exited.
        this.stopAlarm();
        this.#taskEl?.querySelector('.btn-stop-alarm')?.classList.add('d-none');
        this.#taskEl = null;

        notifySuccess(
            t('timer.stopped.title'),
            t('timer.stopped.message', { name: this.#task.taskName })
        );

        // Reset the task reference so it does not linger between sessions.
        this.#task = null;
        this.#taskNotified = false;
    }
    
    stopAlarm() {
        if (!this.#alarmInterval) return;
        
        clearInterval(this.#alarmInterval);
        this.#alarmInterval = null;
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
                'BeeTrack - ' + this.#task.name,
                t('timer.exceeded')
            );

            if (this.#task.playSound) {
                this.#taskEl.querySelector('.btn-stop-alarm').classList.remove('d-none');
                this.#alarmInterval = setInterval(() => {
                    playSound();
                }, 1600);
            }
        }
        
        const tElapsed = secondsToParts(this.#task.timeElapsed);
        const tLeft = secondsToParts(Math.abs(this.#task.timeAim - this.#task.timeElapsed));
        const percentage = this.#task.timeElapsed / this.#task.timeAim * 100;
        const sign = this.#task.timeElapsed > this.#task.timeAim ? '-' : '';

        this.#taskEl.querySelector('.timer .h').innerText = tElapsed.h.toString();
        this.#taskEl.querySelector('.timer .m').innerText = tElapsed.m.toString().padStart(2, '0');
        this.#taskEl.querySelector('.timer .s').innerText = tElapsed.s.toString().padStart(2, '0');

        this.#taskEl.querySelector('.time-left .h').innerText = sign + tLeft.h.toString();
        this.#taskEl.querySelector('.time-left .m').innerText = tLeft.m.toString().padStart(2, '0');
        this.#taskEl.querySelector('.time-left .s').innerText = tLeft.s.toString().padStart(2, '0');

        this.#taskEl.querySelector('.clock-percentage .percentage').innerText = percentage.toFixed(2);
    }
}