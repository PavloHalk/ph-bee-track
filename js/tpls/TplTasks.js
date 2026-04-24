import Tpl from './Tpl.js';
import Task from '../models/Task.js';
import Timer from '../Timer.js';
import {notifySuccess} from '../utils.js';

export default class TplTasks extends Tpl {
    #tasks = null;
    #timer = null;
    
    #tplCreateTask = null;
    #tplTasks = null;
    
    static get htmlPath() {
        return 'tasks';
    }

    get classAttr() {
        return 'tpl tpl-tasks';
    }
    
    async init(userId, timer) {
        this.#tplCreateTask = this.getElement().querySelector('.new-task-container');
        this.#tplTasks = this.getElement().querySelector('.tasks-container');
        
        this.#timer = timer;
        this.#tasks = await Task.allForUser(userId);
        this.#renderTasks();
        
        this.#listenBtnCreateTask();
        this.#listenColorSampleClick();
        this.#listenTaskNameInput();
        this.#listenTimeInput();
        this.#listenBtnCreateTaskCancel();
        this.#listenBtnCreateTaskSubmit(userId);
        
        this.#listenBtnTaskTrackStart();
        this.#listenBtnTaskTrackStop();
    }
    
    #listenBtnCreateTask() {
        this.getElement().querySelector('.new-task').addEventListener('click', () => {
            this.#tplTasks.classList.add('d-none')
            this.#tplCreateTask.classList.remove('d-none');
            this.#tplCreateTask.querySelector('input[name="name"]').focus();
        });
    }

    #listenColorSampleClick() {
        this.#tplCreateTask.addEventListener('click', (event) => {
            if (!event.target.closest('.color-sample')) return;

            this.#tplCreateTask.querySelector('[name="color"]').value = event.target.style.backgroundColor;

            for (const colorSample of this.#tplCreateTask.querySelectorAll('.color-sample')) {
                colorSample.classList.remove('selected');
            }
            event.target.classList.add('selected');
        });
    }

    #listenTaskNameInput() {
        this.#tplCreateTask.querySelector('[name="name"]').addEventListener('input', (event) => {
            event.target.classList.remove('invalid');
            event.target.nextElementSibling.innerText = '';
        });
    }
    
    #listenTimeInput() {
        this.#tplCreateTask.querySelector('form').addEventListener('input', (event) => {
            if (!event.target.closest('input[type="number"]')) return;
            
            event.target.classList.remove('invalid');
            event.target.closest('form').elements['time-aim-m'].nextElementSibling.innerText = '';
        });
    }

    #listenBtnCreateTaskCancel() {
        this.#tplCreateTask.querySelector('.btn-create-task-cancel').addEventListener('click', () => {
            this.#tplTasks.classList.remove('d-none')
            this.#tplCreateTask.classList.add('d-none');
        });
    }

    #listenBtnCreateTaskSubmit(userId) {
        this.#tplCreateTask.querySelector('.btn-create-task-submit').addEventListener('click', async () => {
            if (!this.#tplCreateTask.querySelector('[name="name"]').value) {
                this.#tplCreateTask.querySelector('[name="name"]').classList.add('invalid');
                this.#tplCreateTask.querySelector('[name="name"]').nextElementSibling.innerText = "У задачі повинно бути ім'я.";
                return;
            }

            const hours = this.#tplCreateTask.querySelector('[name="time-aim-h"]').value;
            const minutes = this.#tplCreateTask.querySelector('[name="time-aim-m"]').value;
            
            if (!/^\d+$/.test(hours)) {
                this.#tplCreateTask.querySelector('[name="time-aim-h"]').classList.add('invalid');
                this.#tplCreateTask.querySelector('[name="time-aim-m"]').nextElementSibling.innerText = 'Години можуть бути лише числом.';
                return;
            }
            if (!/^\d+$/.test(minutes)) {
                this.#tplCreateTask.querySelector('[name="time-aim-m"]').classList.add('invalid');
                this.#tplCreateTask.querySelector('[name="time-aim-m"]').nextElementSibling.innerText = 'Хвилини можуть бути лише числом.';
                return;
            }
            if (Number(hours) < 0) {
                this.#tplCreateTask.querySelector('[name="time-aim-h"]').classList.add('invalid');
                this.#tplCreateTask.querySelector('[name="time-aim-m"]').nextElementSibling.innerText = 'Години можуть бути лише позитивним числом.';
                return;
            }
            if (Number(minutes) > 59 || Number(minutes) < 0) {
                this.#tplCreateTask.querySelector('[name="time-aim-m"]').classList.add('invalid');
                this.#tplCreateTask.querySelector('[name="time-aim-m"]').nextElementSibling.innerText = 'Хвилини можуть бути лише числом від 0 до 59.';
                return;
            }

            const task = new Task();
            task.userId = userId;
            task.taskName = this.#tplCreateTask.querySelector('[name="name"]').value;
            task.description = this.#tplCreateTask.querySelector('[name="description"]').value;
            task.color = this.#tplCreateTask.querySelector('[name="color"]').value;
            
            task.timeAim = hours * 3600 + minutes * 60;
            task.timeElapsed = 0;
            task.timeElapsedTotal = 0;

            await task.save();

            notifySuccess('BeeTrack', `Задача "${task.taskName}" успішно створена!"`);
            this.#tplTasks.classList.remove('d-none')
            this.#tplCreateTask.classList.add('d-none');
            this.#tasks = await Task.allForUser(userId);
            this.#renderTasks();
        });
    }
    
    #listenBtnTaskTrackStart() {
        this.#tplTasks.addEventListener('click', async (event) => {
            if (!event.target.closest('.btn-start')) return;
            if (event.target.closest('.btn-start').classList.contains('disabled')) return;

            const task = await Task.getById(event.target.closest('.task').dataset.taskId);
            this.#timer.setTask(task);
            this.#timer.start();
            
            event.target.closest('.btn-start').classList.add('disabled');
            event.target.closest('.task').querySelector('.btn-stop').classList.remove('disabled');
            event.target.closest('.task').classList.add('active');
        });
    }
    
    #listenBtnTaskTrackStop() {
        this.#tplTasks.addEventListener('click', async (event) => {
            if (!event.target.closest('.btn-stop')) return;
            if (event.target.closest('.btn-stop').classList.contains('disabled')) return;

            this.#timer.stop();
            
            event.target.closest('.btn-stop').classList.add('disabled');
            event.target.closest('.task').querySelector('.btn-start').classList.remove('disabled');
            event.target.closest('.task').classList.remove('active');
        });
    }
    
    #renderTasks() {
        for (const taskEl of this.#tplTasks.querySelectorAll('.task:not(.new-task)')) {
            taskEl.remove();
        }
        
        const taskTemplate = this.#tplTasks.querySelector('.task-template');
        
        for (const task of this.#tasks) {
            const taskEl = taskTemplate.cloneNode(true);
            
            const timeAim = this.#secondsToTime(task.time_aim);
            const timeElapsed = this.#secondsToTime(task.time_elapsed);
            const timeDiff = this.#secondsToTime(Number(task.time_aim) - Number(task.time_elapsed));
            const percentage = Number(task.time_elapsed) / Number(task.time_aim) * 100;
            
            taskEl.dataset.taskId = task.id;
            
            taskEl.classList.remove('task-template');
            taskEl.classList.remove('d-none');
            taskEl.classList.add('task');

            //taskEl.style.backgroundColor = 'color-mix(in srgb, ' + task.color + ' 10%, transparent)';
            taskEl.style.backgroundColor = task.color;
            taskEl.style.boxShadow = '0 0 50px ' + task.color;
            
            taskEl.querySelector('.task-title').innerText = task.name
            taskEl.querySelector('.task-description').innerText = task.description;
            
            taskEl.querySelector('.time-aim .h').innerText = timeAim.h.toString();
            taskEl.querySelector('.time-aim .m').innerText = timeAim.m.toString().padStart(2, '0');
            taskEl.querySelector('.time-aim .s').innerText = timeAim.s.toString().padStart(2, '0');

            taskEl.querySelector('.timer .h').innerText = timeElapsed.h.toString();
            taskEl.querySelector('.timer .m').innerText = timeElapsed.m.toString().padStart(2, '0');
            taskEl.querySelector('.timer .s').innerText = timeElapsed.s.toString().padStart(2, '0');

            taskEl.querySelector('.time-left .h').innerText = timeDiff.h.toString();
            taskEl.querySelector('.time-left .m').innerText = timeDiff.m.toString().padStart(2, '0');
            taskEl.querySelector('.time-left .s').innerText = timeDiff.s.toString().padStart(2, '0');

            taskEl.querySelector('.clock-percentage .percentage').innerText = percentage.toFixed(2);
            
            this.#tplTasks.prepend(taskEl);
        }
    }
    
    #secondsToTime(sec) {
        return {
            s: sec % 60,
            m: Math.floor((sec % 3600) / 60),
            h: Math.floor(sec / 3600)
        }
    }
}