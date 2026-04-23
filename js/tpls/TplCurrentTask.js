import Tpl from './Tpl.js';
import Task from '../models/Task.js';
import {notifySuccess} from "../utils.js";

export default class TplCurrentTask extends Tpl {
    static get htmlPath() {
        return 'current-task';
    }

    get classAttr() {
        return 'tpl tpl-current-task';
    }
    
    async init(userId) {
        const tasks = await Task.allForUser(userId);
        
        const tplNoTasks = this.getElement().querySelector('.no-tasks');
        const tplHaveTasks = this.getElement().querySelector('.have-tasks');
        const tplCreateTask = this.getElement().querySelector('.edit-task');

        if (tasks.length === 0) {
            tplNoTasks.hidden = false;
        } else {
            tplHaveTasks.hidden = false;
        }

        tplNoTasks.querySelector('.btn-create-task').addEventListener('click', () => {
            tplNoTasks.hidden = true;
            tplHaveTasks.hidden = true;
            tplCreateTask.hidden = false;
            tplCreateTask.querySelector('[name="name"]').focus();
        });
        
        tplCreateTask.addEventListener('click', (event) => {
            if (!event.target.closest('.color-sample')) return;
            
            tplCreateTask.querySelector('[name="color"]').value = event.target.style.backgroundColor;
            
            for (const colorSample of tplCreateTask.querySelectorAll('.color-sample')) {
                colorSample.classList.remove('selected');
            }
            event.target.classList.add('selected');
        });

        tplCreateTask.querySelector('[name="name"]').addEventListener('input', (event) => {
            event.target.classList.remove('invalid');
            event.target.nextElementSibling.innerText = '';
        });
        
        tplCreateTask.querySelector('.btn-create-task-submit').addEventListener('click', async () => {
            if (!tplCreateTask.querySelector('[name="name"]').value) {
                tplCreateTask.querySelector('[name="name"]').classList.add('invalid');
                tplCreateTask.querySelector('[name="name"]').nextElementSibling.innerText = "У задачі повинно бути ім'я.";
                return;
            }
            
            const task = new Task();
            task.userId = document.querySelector('header .profile').dataset.userId;
            task.taskName = tplCreateTask.querySelector('[name="name"]').value;
            task.description = tplCreateTask.querySelector('[name="description"]').value;
            task.color = tplCreateTask.querySelector('[name="color"]').value;
            
            await task.save();
            
            notifySuccess('BeeTrack', `Задача "${task.taskName}" успішно створена!"`);
            tplCreateTask.hidden = true;
            tplHaveTasks.hidden = false;
        });

        tplCreateTask.querySelector('.btn-create-task-cancel').addEventListener('click', () => {
            tplCreateTask.hidden = true;

            if (tasks.length === 0) {
                tplNoTasks.hidden = false;
            } else {
                tplHaveTasks.hidden = false;
            }
        });
    }
}