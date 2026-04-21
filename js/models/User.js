import Model from './Model.js'
import {executeSql} from "../pyapi.js";

export default class User extends Model {
    get table() {
        return 'users';
    }
    
    async save() {
        const date = (new Date()).toISOString().substring(0, 19).replace('T', ' ');
        
        try {
            const result = await executeSql(`INSERT INTO users (username, created_at) VALUES("${this.username}", "${date}")`);
            return result.status === 'success';
        } catch (err) {
            throw err;
        }
    }
    
    static async all() {
        try {
            return await executeSql("SELECT * FROM users");
        } catch (err) {
            throw err;
        }
    }
    
    static async getById(id) {
        try {
            const result = await executeSql("SELECT * FROM users WHERE id=" + id);
            
            if (Array.isArray(result) && result.length) {
                return result[0];
            } else {
                throw new Error("No such user.");
            }
        } catch (err) {
            throw err;
        }
    }
}