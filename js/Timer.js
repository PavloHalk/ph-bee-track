import Task from './models/Task.js';

export default class Timer {
    #task = null;
    
    setTask(task) {
        if (!(task instanceof Task)) throw new TypeError('Timer requires an instance of Task.');
        
        if (this.#task) {
            const click = new Event('click', { bubbles: true, cancelable: true });
            document.querySelector('.task[data-task-id="'+this.#task.id+'"] .btn-stop').dispatchEvent(click);
        }
        
        this.#task = task;
    }
}