import Tpl from './Tpl.js';
import Task from '../models/Task.js';
import {notifySuccess} from "../utils.js";

export default class TplCurrentTask extends Tpl {
    #tplNoTasks = null;
    #tplHaveTasks = null;
    #tplCreateTask = null;
    
    #tasks = [];
    
    static get htmlPath() {
        return 'current-task';
    }

    get classAttr() {
        return 'tpl tpl-current-task';
    }
    
    async init(userId) {
        this.#tplNoTasks = this.getElement().querySelector('.no-tasks');
        this.#tplHaveTasks = this.getElement().querySelector('.have-tasks');
        this.#tplCreateTask = this.getElement().querySelector('.edit-task');

        this.#tasks = await Task.allForUser(userId);
        this.#fillTaskList();

        if (this.#tasks.length === 0) {
            this.#tplNoTasks.hidden = false;
        } else {
            this.#tplHaveTasks.hidden = false;
        }
        
        this.#listenTaskSelect();
        this.#listenBtnCreateTaskClick();
        this.#listenTaskNameInput();
        this.#listenColorSampleClick();
        this.#listenCreateTaskSubmit(userId);
        this.#listenCreateTaskCancel();
    }
    
    #listenBtnCreateTaskClick() {
        this.#tplNoTasks.querySelector('.btn-create-task').addEventListener('click', () => {
            this.#tplNoTasks.hidden = true;
            //this.#tplHaveTasks.hidden = true;
            this.#tplCreateTask.hidden = false;
            this.#tplCreateTask.querySelector('[name="name"]').focus();
        });

        this.#tplHaveTasks.querySelector('.btn-create-task').addEventListener('click', () => {
            this.#tplNoTasks.hidden = true;
            //this.#tplHaveTasks.hidden = true;
            this.#tplCreateTask.hidden = false;
            this.#tplCreateTask.querySelector('[name="name"]').focus();
        });
    }
    
    #listenTaskNameInput() {
        this.#tplCreateTask.querySelector('[name="name"]').addEventListener('input', (event) => {
            event.target.classList.remove('invalid');
            event.target.nextElementSibling.innerText = '';
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
    
    #listenCreateTaskSubmit(userId) {
        this.#tplCreateTask.querySelector('.btn-create-task-submit').addEventListener('click', async () => {
            if (!this.#tplCreateTask.querySelector('[name="name"]').value) {
                this.#tplCreateTask.querySelector('[name="name"]').classList.add('invalid');
                this.#tplCreateTask.querySelector('[name="name"]').nextElementSibling.innerText = "У задачі повинно бути ім'я.";
                return;
            }

            const task = new Task();
            task.userId = document.querySelector('header .profile').dataset.userId;
            task.taskName = this.#tplCreateTask.querySelector('[name="name"]').value;
            task.description = this.#tplCreateTask.querySelector('[name="description"]').value;
            task.color = this.#tplCreateTask.querySelector('[name="color"]').value;

            await task.save();

            notifySuccess('BeeTrack', `Задача "${task.taskName}" успішно створена!"`);
            this.#tplCreateTask.hidden = true;
            this.#tplHaveTasks.hidden = false;
            this.#tasks = await Task.allForUser(userId);
            this.#fillTaskList();
        });
    }
    
    #listenCreateTaskCancel() {
        this.#tplCreateTask.querySelector('.btn-create-task-cancel').addEventListener('click', () => {
            this.#tplCreateTask.hidden = true;

            if (this.#tasks.length === 0) {
                this.#tplNoTasks.hidden = false;
            } else {
                this.#tplHaveTasks.hidden = false;
            }
        });
    }
    
    #listenTaskSelect() {
        const selectEl = this.#tplHaveTasks.querySelector('#tasklist');
        const labelEl = this.#tplHaveTasks.querySelector('.task-label');
        
        if (selectEl.options.length) {
            labelEl.style.borderColor = selectEl.options[selectEl.selectedIndex].dataset.color;
        }
        
        this.#tplHaveTasks.querySelector('#tasklist').addEventListener('change', () => {
            if (selectEl.options.length) {
                labelEl.style.borderColor = selectEl.options[selectEl.selectedIndex].dataset.color;
            }
        });
    }
    
    #fillTaskList() {
        const selectEl = this.#tplHaveTasks.querySelector('#tasklist');
        selectEl.options.length = 0;
        
        for (const task of this.#tasks) {
            const optionEl = new Option(task.name, task.id.toString(), false, false);
            optionEl.dataset.color = task.color;
            selectEl.add(optionEl);
        }
        
        if (selectEl.options.length) {
            selectEl.options[0].selected = true;
            this.#tplHaveTasks.querySelector('.task-label').style.borderColor = selectEl.options[0].dataset.color;
        }
    }
}