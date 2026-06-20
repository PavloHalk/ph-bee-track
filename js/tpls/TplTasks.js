import Tpl from './Tpl.js';
import Task from '../models/Task.js';
import {notifyCritical, notifySuccess, showConfirm, validateRequiredLine, secondsToParts, MAX_NAME_LENGTH, MAX_DESCRIPTION_LENGTH, MAX_AIM_HOURS} from '../utils.js';
import { t } from '../i18n.js';

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
        this.#listenDescriptionInput();
        this.#listenTimeInput();
        this.#listenBtnCreateTaskCancel();
        this.#listenBtnCreateTaskSubmit(userId);
        
        this.#listenBtnTaskTrackStart();
        this.#listenBtnTaskTrackStop();
        this.#listenBtnTaskReset();
        
        this.#listenBtnCloseTask();
        this.#listenBtnEditTask();
        this.#listenBtnStopAlarm();
    }
    
    #listenBtnCreateTask() {
        this.getElement().querySelector('.new-task').addEventListener('click', () => {
            this.#tplTasks.classList.add('d-none')
            this.#tplEditTask.classList.remove('d-none');

            const title = this.#tplEditTask.querySelector('h4');
            title.dataset.i18n = 'tasks.form.createTitle';
            title.innerText = t('tasks.form.createTitle');
            
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
    
    #listenDescriptionInput() {
        this.#tplEditTask.querySelector('[name="description"]').addEventListener('input', (event) => {
            event.target.classList.remove('invalid');
            event.target.nextElementSibling.innerText = '';
        });
    }

    #listenTimeInput() {
        this.#tplEditTask.querySelector('form').addEventListener('input', (event) => {
            if (!event.target.closest('input[type="number"]')) return;

            const form = event.target.closest('form');
            // The time error is shared by both fields, so clear the highlight from both.
            form.elements['time-aim-h'].classList.remove('invalid');
            form.elements['time-aim-m'].classList.remove('invalid');
            form.elements['time-aim-m'].closest('.col-9').querySelector('.field-error-msg').innerText = '';
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
            
            const name = validateRequiredLine(form.elements['name'], MAX_NAME_LENGTH, {
                empty: t('tasks.form.errors.noName'),
                tooLong: t('tasks.form.errors.nameTooLong', { max: MAX_NAME_LENGTH }),
            });
            if (name === null) return;

            const description = form.elements['description'].value.trim();
            form.elements['description'].value = description;
            if (description.length > MAX_DESCRIPTION_LENGTH) {
                form.elements['description'].classList.add('invalid');
                form.elements['description'].nextElementSibling.innerText = t('tasks.form.errors.descriptionTooLong', { max: MAX_DESCRIPTION_LENGTH });
                return;
            }

            const hours = form.elements['time-aim-h'].value;
            const minutes = form.elements['time-aim-m'].value;
            // The time error message is a separate <p class="field-error-msg">
            // under both fields (NOT nextElementSibling, because a <span>min.</span> sits there).
            const timeError = form.elements['time-aim-m'].closest('.col-9').querySelector('.field-error-msg');

            if (!/^\d+$/.test(hours)) {
                form.elements['time-aim-h'].classList.add('invalid');
                timeError.innerText = t('tasks.form.errors.hoursNumeric');
                return;
            }
            if (!/^\d+$/.test(minutes)) {
                form.elements['time-aim-m'].classList.add('invalid');
                timeError.innerText = t('tasks.form.errors.minutesNumeric');
                return;
            }
            if (Number(hours) > MAX_AIM_HOURS) {
                form.elements['time-aim-h'].classList.add('invalid');
                timeError.innerText = t('tasks.form.errors.hoursMax', { max: MAX_AIM_HOURS });
                return;
            }
            if (Number(minutes) > 59 || Number(minutes) < 0) {
                form.elements['time-aim-m'].classList.add('invalid');
                timeError.innerText = t('tasks.form.errors.minutesRange');
                return;
            }
            if (Number(hours) * 3600 + Number(minutes) * 60 <= 0) {
                form.elements['time-aim-h'].classList.add('invalid');
                form.elements['time-aim-m'].classList.add('invalid');
                timeError.innerText = t('tasks.form.errors.timeZero');
                return;
            }

            let task = new Task();

            if (Number(form.elements['id'].value)) {
                task = await Task.getById(form.elements['id'].value);
            }

            task.userId = userId;
            task.taskName = name;
            task.description = description;
            task.color = form.elements['color'].value;
            task.playSound = form.elements['play-sound'].checked ? 1 : 0;
            
            task.timeAim = hours * 3600 + minutes * 60;
            
            if (!task.id) {
                task.timeElapsed = 0;
                task.timeElapsedTotal = 0;
            }

            await task.save();

            notifySuccess('BeeTrack', t(
                task.id ? 'tasks.notifications.savedUpdated' : 'tasks.notifications.savedCreated',
                { name: task.taskName }
            ));
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
            
            showConfirm(t('tasks.confirmReset.title'), t('tasks.confirmReset.text'), async () => {
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
                    t('tasks.notifications.trackingTitle'),
                    t('tasks.notifications.trackingArchive')
                );
                return;
            }
            
            showConfirm(t('tasks.confirmArchive.title'), t('tasks.confirmArchive.text'), async () => {
                const click = new Event('click', { bubbles: true, cancelable: true });
                event.target.closest('.task').querySelector('.btn-stop').dispatchEvent(click);

                const task = await Task.getById(event.target.closest('.task').dataset.taskId);
                await task.archive();

                event.target.closest('.task').remove();
                notifySuccess(t('tasks.notifications.archivedTitle'), t('tasks.notifications.archivedMessage', { name: task.taskName }));
            });
        });
    }
    
    #listenBtnEditTask() {
        this.#tplTasks.addEventListener('click', async (event) => {
            if (!event.target.closest('.btn-edit-task')) return;
            
            if (event.target.closest('.task').classList.contains('active')) {
                notifyCritical(
                    t('tasks.notifications.trackingTitle'),
                    t('tasks.notifications.trackingEdit')
                );
                return;
            }

            const task = await Task.getById(event.target.closest('.task').dataset.taskId);
            
            this.#tplTasks.classList.add('d-none');
            this.#tplEditTask.classList.remove('d-none');
            const title = this.#tplEditTask.querySelector('h4');
            title.dataset.i18n = 'tasks.form.editTitle';
            title.innerText = t('tasks.form.editTitle');
            
            const form = this.#tplEditTask.querySelector('form');
            form.elements['id'].value = task.id;
            form.elements['name'].value = task.taskName;
            form.elements['description'].value = task.description;
            form.elements['play-sound'].checked = !!task.playSound;
            form.elements['time-aim-h'].value = Math.floor(task.timeAim / 3600);
            form.elements['time-aim-m'].value = (task.timeAim - (Math.floor(task.timeAim / 3600) * 3600)) / 60;
            
            const click = new Event('click', { bubbles: true, cancelable: true });
            // Highlight the swatch of the saved color; if there is none (legacy/
            // non-standard data) or the selector is invalid — fall back to the first swatch.
            let colorSample = null;
            try {
                colorSample = form.querySelector('.color-sample.color-' + task.color);
            } catch {
                colorSample = null;
            }
            (colorSample ?? form.querySelector('.color-sample')).dispatchEvent(click);
        });
    }
    
    #listenBtnStopAlarm() {
        this.#tplTasks.addEventListener('click', async (event) => {
            if (!event.target.closest('.btn-stop-alarm')) return;
            
            this.#timer.stopAlarm();
            event.target.closest('.btn-stop-alarm').classList.add('d-none');
        });   
    }
    
    #renderTasks() {
        for (const taskEl of this.#tplTasks.querySelectorAll('.task:not(.new-task)')) {
            taskEl.remove();
        }
        
        const taskTemplate = this.#tplTasks.querySelector('.task-template');
        
        for (const task of this.#tasks) {
            const taskEl = taskTemplate.cloneNode(true);
            
            const timeAim = secondsToParts(task.time_aim);
            const timeElapsed = secondsToParts(task.time_elapsed);
            const timeDiff = secondsToParts(Math.abs(Number(task.time_aim) - Number(task.time_elapsed)));
            const percentage = Number(task.time_elapsed) / Number(task.time_aim) * 100;
            const sign = Number(task.time_aim) < Number(task.time_elapsed) ? '-' : '';
            
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

            taskEl.querySelector('.time-left .h').innerText = sign + timeDiff.h.toString();
            taskEl.querySelector('.time-left .m').innerText = timeDiff.m.toString().padStart(2, '0');
            taskEl.querySelector('.time-left .s').innerText = timeDiff.s.toString().padStart(2, '0');

            taskEl.querySelector('.clock-percentage .percentage').innerText = percentage.toFixed(2);
            
            this.#tplTasks.prepend(taskEl);
        }
    }
    
}