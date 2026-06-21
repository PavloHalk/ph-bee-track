import Model from './Model.js';
import {executeSql} from "../pyapi.js";
import {toSqlDateTime} from "../utils.js";

export default class Track extends Model {
    get table() {
        return 'tracks';
    }

    async save() {
        try {
            if (!this.id) {
                const result = await executeSql(
                    `INSERT INTO tracks (user_id, task_id, started_at, stopped_at) VALUES(?, ?, ?, ?) RETURNING id`,
                    [this.userId, this.taskId, this.startedAt, this.stoppedAt]
                );
                this.id = result[0].id;
            } else {
                await executeSql(
                    `UPDATE tracks SET user_id=?, task_id=?, started_at=?, stopped_at=? WHERE id=?`,
                    [this.userId, this.taskId, this.startedAt, this.stoppedAt, this.id]
                );
            }
        } catch (err) {
            throw err;
        }
    }
    
    // Tracks that overlap the local year [year-01-01, (year+1)-01-01).
    // The boundaries are local dates converted to UTC, because
    // started_at/stopped_at are stored in UTC.
    static async getYearRecords(userId, year, includeArchived = false) {
        const start = toSqlDateTime(new Date(year, 0, 1));
        const end = toSqlDateTime(new Date(year + 1, 0, 1));
        const archivedFilter = includeArchived ? '' : ' AND tk.is_deleted = 0';
        const sql = `SELECT tr.* FROM tracks tr
                                LEFT JOIN tasks tk ON tk.id = tr.task_id
                                WHERE tr.user_id = ?
                                AND tr.started_at < ?
                                AND tr.stopped_at >= ?${archivedFilter}`;

        return await executeSql(sql, [userId, end, start]);
    }

    // Tracks that overlap the week [monday, monday + 7 days).
    // monday — local date (Monday at 00:00); the boundaries are converted to UTC,
    // because started_at/stopped_at are stored in UTC.
    static async getWeekRecords(userId, monday, includeArchived = false) {
        const start = toSqlDateTime(monday);
        const end = new Date(monday);
        end.setDate(end.getDate() + 7);
        const endStr = toSqlDateTime(end);
        const archivedFilter = includeArchived ? '' : ' AND tk.is_deleted = 0';

        const sql = `SELECT tr.started_at, tr.stopped_at, tr.task_id,
                                tk.name AS task_name, tk.color AS task_color
                            FROM tracks tr
                            LEFT JOIN tasks tk ON tk.id = tr.task_id
                            WHERE tr.user_id = ?
                            AND tr.started_at < ?
                            AND tr.stopped_at >= ?${archivedFilter}`;

        return await executeSql(sql, [userId, endStr, start]);
    }
}