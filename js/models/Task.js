import Model from './Model.js'
import {executeSql} from "../pyapi.js";

export default class Task extends Model {
    get table() {
        return 'tasks';
    }

    static async getById(id) {
        try {
            const result = await executeSql("SELECT * FROM tasks WHERE id=" + id);
            return this.#fillTask(result);
        } catch (err) {
            throw err;
        }
    }
    
    static async allForUser(userId) {
        return await executeSql(`SELECT * FROM tasks WHERE user_id=${userId} AND is_deleted=0`);
    }

    async save() {
        const date = (new Date()).toISOString().substring(0, 19).replace('T', ' ');

        const result = { status: 'pending' }
        try {
            if (!this.id) {
                const result = await executeSql(`INSERT INTO tasks (user_id, name, description, color, play_sound, time_aim, time_elapsed, time_elapsed_total, created_at) VALUES("${this.userId}", "${this.taskName}", "${this.description}", "${this.color}", "${this.playSound}", "${this.timeAim}", "${this.timeElapsed}", "${this.timeElapsedTotal}", "${date}")`);
            } else {
                const result = await executeSql(`UPDATE tasks SET name="${this.taskName}", description="${this.description}", color="${this.color}", play_sound="${this.playSound}", time_aim="${this.timeAim}", time_elapsed="${this.timeElapsed}", time_elapsed_total="${this.timeElapsedTotal}" WHERE id=${this.id}`);
            }

            return result.status === 'success';
        } catch (err) {
            throw err;
        }
    }
    
    async archive() {
        await executeSql(`UPDATE tasks SET is_deleted=1 WHERE id=${this.id}`);
    }

    static #fillTask(result) {
        if (Array.isArray(result) && result.length) {
            const task = new Task();
            task.id = result[0].id;
            task.userId = result[0].user_id;
            task.taskName = result[0].name;
            task.description = result[0].description;
            task.color = result[0].color;
            task.playSound = Number(result[0].play_sound) ? 1 : 0;
            task.timeElapsed = Number(result[0].time_elapsed);
            task.timeElapsedTotal = Number(result[0].time_elapsed_total);
            task.timeAim = Number(result[0].time_aim);
            task.created_at = result[0].created_at;

            return task;
        } else {
            throw new Error("No such task.");
        }
    }
}