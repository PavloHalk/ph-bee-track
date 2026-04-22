import Model from './Model.js'
import {executeSql} from "../pyapi.js";

export default class Task extends Model {
    get table() {
        return 'tasks';
    }
    
    static async allForUser(userId) {
        return await executeSql("SELECT * FROM tasks WHERE user_id=" + userId);
    }

    async save() {
        const date = (new Date()).toISOString().substring(0, 19).replace('T', ' ');

        const result = { status: 'pending' }
        try {
            if (!this.id) {
                const result = await executeSql(`INSERT INTO tasks (user_id, name, description, color, created_at) VALUES("${this.userId}", "${this.taskName}", "${this.description}", "${this.color}", "${date}")`);
            } else {
                const result = await executeSql(`UPDATE users SET name="${this.taskName}", "description=${this.description}", color="${this.color}", WHERE id=${this.id}`);
            }

            return result.status === 'success';
        } catch (err) {
            throw err;
        }
    }
}