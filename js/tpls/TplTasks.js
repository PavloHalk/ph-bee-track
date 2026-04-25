import Tpl from './Tpl.js';
import Task from '../models/Task.js';
import Timer from '../Timer.js';
import {notifyCritical, notifySuccess, showConfirm} from '../utils.js';

export default class TplTasks extends Tpl {
    #tasks = null;
    #timer = null;
    
    #tplEditTask = null;
    #tplTasks = null;
    
    static get htmlPath() {
        return 'tasks';
    }

    get classAttr() {
        return 'tpl tpl-tasks';
    }
    
    async init(userId, timer) {
        this.#tplEditTask = this.getElement().querySelector('.edit-task-container');
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
        this.#listenBtnTaskReset();
        
        this.#listenBtnCloseTask();
        this.#listenBtnEditTask();
    }
    
    #listenBtnCreateTask() {
        this.getElement().querySelector('.new-task').addEventListener('click', () => {
            this.#tplTasks.classList.add('d-none')
            this.#tplEditTask.classList.remove('d-none');

            this.#tplEditTask.querySelector('h4').innerText = "Створення нової задачі";
            
            const form = this.#tplEditTask.querySelector('form');
            form.elements['id'].value = '0';
            form.elements['name'].value = '';
            form.elements['description'].value = '';
            form.elements['time-aim-h'].value = 40;
            form.elements['time-aim-m'].value = 0;

            const click = new Event('click', { bubbles: true, cancelable: true });
            form.querySelector('.color-sample').dispatchEvent(click);
            
            this.#tplEditTask.querySelector('input[name="name"]').focus();
        });
    }

    #listenColorSampleClick() {
        this.#tplEditTask.addEventListener('click', (event) => {
            if (!event.target.closest('.color-sample')) return;

            this.#tplEditTask.querySelector('[name="color"]').value = event.target.style.backgroundColor;

            for (const colorSample of this.#tplEditTask.querySelectorAll('.color-sample')) {
                colorSample.classList.remove('selected');
            }
            event.target.classList.add('selected');
        });
    }

    #listenTaskNameInput() {
        this.#tplEditTask.querySelector('[name="name"]').addEventListener('input', (event) => {
            event.target.classList.remove('invalid');
            event.target.nextElementSibling.innerText = '';
        });
    }
    
    #listenTimeInput() {
        this.#tplEditTask.querySelector('form').addEventListener('input', (event) => {
            if (!event.target.closest('input[type="number"]')) return;
            
            event.target.classList.remove('invalid');
            event.target.closest('form').elements['time-aim-m'].nextElementSibling.innerText = '';
        });
    }

    #listenBtnCreateTaskCancel() {
        this.#tplEditTask.querySelector('.btn-create-task-cancel').addEventListener('click', () => {
            this.#tplTasks.classList.remove('d-none')
            this.#tplEditTask.classList.add('d-none');
        });
    }

    #listenBtnCreateTaskSubmit(userId) {
        this.#tplEditTask.querySelector('.btn-create-task-submit').addEventListener('click', async () => {
            const form = this.#tplEditTask.querySelector('form');
            
            if (!form.elements['name'].value) {
                form.elements['name'].classList.add('invalid');
                form.elements['name'].nextElementSibling.innerText = "У задачі повинно бути ім'я.";
                return;
            }

            const hours = form.elements['time-aim-h'].value;
            const minutes = form.elements['time-aim-m'].value;
            
            if (!/^\d+$/.test(hours)) {
                form.elements['time-aim-h'].classList.add('invalid');
                form.elements['time-aim-m'].nextElementSibling.innerText = 'Години можуть бути лише числом.';
                return;
            }
            if (!/^\d+$/.test(minutes)) {
                form.elements['time-aim-m'].classList.add('invalid');
                form.elements['time-aim-m'].nextElementSibling.innerText = 'Хвилини можуть бути лише числом.';
                return;
            }
            if (Number(hours) < 0) {
                form.elements['time-aim-h'].classList.add('invalid');
                form.elements['time-aim-m'].nextElementSibling.innerText = 'Години можуть бути лише позитивним числом.';
                return;
            }
            if (Number(minutes) > 59 || Number(minutes) < 0) {
                form.elements['time-aim-m'].classList.add('invalid');
                form.elements['time-aim-m'].nextElementSibling.innerText = 'Хвилини можуть бути лише числом від 0 до 59.';
                return;
            }

            let task = new Task();
            
            if (form.elements['id']) {
                task = await Task.getById(form.elements['id'].value);
            }
            
            task.userId = userId;
            task.taskName = form.elements['name'].value;
            task.description = form.elements['description'].value;
            task.color = form.elements['color'].value;
            
            task.timeAim = hours * 3600 + minutes * 60;
            
            if (!task.id) {
                task.timeElapsed = 0;
                task.timeElapsedTotal = 0;
            }

            await task.save();

            notifySuccess('BeeTrack', `Задача "${task.taskName}" успішно ${task.id ? 'відредагована' : 'створена'}!"`);
            this.#tplTasks.classList.remove('d-none')
            this.#tplEditTask.classList.add('d-none');
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
    
    #listenBtnTaskReset() {
        this.#tplTasks.addEventListener('click', async (event) => {
            if (!event.target.closest('.btn-reset')) return;
            
            const confirmText = 'Ви впевнені, що хочете скинути таймер? Поточний прогрес таймеру буде втрачений незворотньо, проте весь відстежений час залишиться в історії і може буде відображений в статистиці при активованій опції обробки всього часу.';
            
            showConfirm('Скинути таймер?', confirmText, async () => {
                const click = new Event('click', { bubbles: true, cancelable: true });
                event.target.closest('.task').querySelector('.btn-stop').dispatchEvent(click);

                const task = await Task.getById(event.target.closest('.task').dataset.taskId);
                task.timeElapsed = 0;
                await task.save();

                const taskEl = event.target.closest('.task');

                taskEl.querySelector('.timer .h').innerText = '0';
                taskEl.querySelector('.timer .m').innerText = '00';
                taskEl.querySelector('.timer .s').innerText = '00';

                taskEl.querySelector('.time-left .h').innerText = taskEl.querySelector('.time-aim .h').innerText;
                taskEl.querySelector('.time-left .m').innerText = taskEl.querySelector('.time-aim .m').innerText;
                taskEl.querySelector('.time-left .s').innerText = taskEl.querySelector('.time-aim .s').innerText;

                taskEl.querySelector('.clock-percentage .percentage').innerText = '0.00';
            });
        });
    }
    
    #listenBtnCloseTask() {
        this.#tplTasks.addEventListener('click', async (event) => {
            if (!event.target.closest('.btn-close-task')) return;

            if (event.target.closest('.task').classList.contains('active')) {
                notifyCritical(
                    'Задача відстежується!',
                    'Спершу зупиніть таймер цієї задачі. Не можна архівувати задачу з працюючим таймером.'
                );
                return;
            }
            
            const confirmText = 'Ви впевнені що хочете архівувати задачу? Архівовані задачі не доступні для перегляду і відстеження часу. Затрачений на задачу час не буде відображатися в загальній статистиці, проте вся історія часу буде збережена і може бути відображена в статистиці при встановленні відповідної опції.';

            showConfirm('Архівувати задачу?', confirmText, async () => {
                const click = new Event('click', { bubbles: true, cancelable: true });
                event.target.closest('.task').querySelector('.btn-stop').dispatchEvent(click);

                const task = await Task.getById(event.target.closest('.task').dataset.taskId);
                await task.archive();

                event.target.closest('.task').remove();
                notifySuccess('Задача архівована!', 'Задача "' + task.taskName + '" була успішно архівована.');
            });
        });
    }
    
    #listenBtnEditTask() {
        this.#tplTasks.addEventListener('click', async (event) => {
            if (!event.target.closest('.btn-edit-task')) return;
            
            if (event.target.closest('.task').classList.contains('active')) {
                notifyCritical(
                    'Задача відстежується!',
                    'Спершу зупиніть таймер цієї задачі. Не можна редагувати задачі з працюючим таймером.'
                );
                return;
            }

            const task = await Task.getById(event.target.closest('.task').dataset.taskId);
            
            this.#tplTasks.classList.add('d-none');
            this.#tplEditTask.classList.remove('d-none');
            this.#tplEditTask.querySelector('h4').innerText = "Редагування задачі";
            
            const form = this.#tplEditTask.querySelector('form');
            form.elements['id'].value = task.id;
            form.elements['name'].value = task.taskName;
            form.elements['description'].value = task.description;
            form.elements['time-aim-h'].value = Math.floor(task.timeAim / 3600);
            form.elements['time-aim-m'].value = (task.timeAim - (Math.floor(task.timeAim / 3600) * 3600)) / 60;
            
            const click = new Event('click', { bubbles: true, cancelable: true });
            form.querySelector('.color-sample.color-' + task.color).dispatchEvent(click);
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