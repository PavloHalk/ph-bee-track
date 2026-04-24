import Task from './models/Task.js';
import { osNotify } from './pyapi.js';

export default class Timer {
    #task = null;
    #taskEl = null;
    #interval = null;
    #lastStartDate = null;
    #elapsedOnLastStart = 0;
    #taskNotified = false;
    
    setTask(task) {
        if (!(task instanceof Task)) throw new TypeError('Timer requires an instance of Task.');
        
        if (this.#task) {
            const click = new Event('click', { bubbles: true, cancelable: true });
            document.querySelector('.task[data-task-id="'+this.#task.id+'"] .btn-stop').dispatchEvent(click);
        }
        
        this.#task = task;
        this.#taskNotified = false;
    }
    
    start() {
        if (this.#interval || !this.#task) return;

        this.#lastStartDate = new Date();
        this.#elapsedOnLastStart = this.#task.timeElapsed;
        this.#taskEl = document.querySelector('.task[data-task-id="'+this.#task.id+'"]');
        this.#interval = setInterval(this.#tick.bind(this), 1000);
    }
    
    stop() {
        if (!this.#interval) return;
        
        clearInterval(this.#interval);
        this.#interval = null;
        this.#taskEl = null;
        
        this.#task.save();
    }
    
    #tick() {
        const diff = Math.floor(((new Date()) - this.#lastStartDate) / 1000);
        this.#task.timeElapsed = this.#elapsedOnLastStart + diff;
        
        if (this.#task.timeElapsed % 5 === 0) {
            this.#task.save();
        }
        
        if (this.#task.timeElapsed > this.#task.timeAim && !this.#taskNotified) {
            this.#taskNotified = true;
            osNotify(
                'BeeTrack - ' + this.#task.name,
                'Ви перевищили запланований на цю задачу час!'
            );
        }
        
        const tElapsed = this.#secondsToTime(this.#task.timeElapsed);
        const tLeft = this.#secondsToTime(this.#task.timeAim - this.#task.timeElapsed);
        const percentage = this.#task.timeElapsed / this.#task.timeAim * 100;

        this.#taskEl.querySelector('.timer .h').innerText = tElapsed.h.toString();
        this.#taskEl.querySelector('.timer .m').innerText = tElapsed.m.toString().padStart(2, '0');
        this.#taskEl.querySelector('.timer .s').innerText = tElapsed.s.toString().padStart(2, '0');

        this.#taskEl.querySelector('.time-left .h').innerText = tLeft.h.toString();
        this.#taskEl.querySelector('.time-left .m').innerText = tLeft.m.toString().padStart(2, '0');
        this.#taskEl.querySelector('.time-left .s').innerText = tLeft.s.toString().padStart(2, '0');

        this.#taskEl.querySelector('.clock-percentage .percentage').innerText = percentage.toFixed(2);
    }

    #secondsToTime(sec) {
        return {
            s: sec % 60,
            m: Math.floor((sec % 3600) / 60),
            h: Math.floor(sec / 3600)
        }
    }
}