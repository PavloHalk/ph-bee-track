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

    // Треки, що перетинаються з тижнем [monday, monday + 7 днів).
    // monday — локальна дата (понеділок о 00:00); межі переводимо у UTC,
    // бо started_at/stopped_at зберігаються в UTC.
    static async getWeekRecords(userId, monday) {
        const start = this.#toSqlUtc(monday);
        const end = new Date(monday);
        end.setDate(end.getDate() + 7);
        const endStr = this.#toSqlUtc(end);

        const sql = `SELECT tr.started_at, tr.stopped_at, tr.task_id,
                                tk.name AS task_name, tk.color AS task_color
                            FROM tracks tr
                            LEFT JOIN tasks tk ON tk.id = tr.task_id
                            WHERE tr.user_id = ${userId}
                            AND tr.started_at < '${endStr}'
                            AND tr.stopped_at >= '${start}'`;

        return await executeSql(sql);
    }

    static #toSqlUtc(date) {
        return date.toISOString().slice(0, 19).replace('T', ' ');
    }
}