import Model from './Model.js';
import {executeSql} from "../pyapi.js";

export default class Track extends Model {
    get table() {
        return 'tracks';
    }

    async save() {
        try {
            if (!this.id) {
                const result = await executeSql(`INSERT INTO tracks (user_id, task_id, started_at, stopped_at) VALUES("${this.userId}", "${this.taskId}", "${this.startedAt}", "${this.stoppedAt}") RETURNING id`);
                this.id = result[0].id;
            } else {
                await executeSql(`UPDATE tracks SET user_id="${this.userId}", task_id="${this.taskId}", started_at="${this.startedAt}", stopped_at="${this.stoppedAt}" WHERE id=${this.id}`);
            }
        } catch (err) {
            throw err;
        }
    }
    
    static async getYearRecords(userId, year) {
        
        const stop = year + '-01-01 00:00:00';
        const start = (year+1) + '-01-01 00:00:00';
        const sql = `SELECT * FROM tracks
                                WHERE user_id = ${userId}
                                AND started_at < '${start}'
                                AND stopped_at >= '${stop}'`;
        
        return await executeSql(sql);
    }
}