import Model from './Model.js'
import { executeSql } from "../pyapi.js";

export default class User extends Model {
    get table() {
        return 'users';
    }
    
    save() {
        const date = (new Date()).toISOString().substring(0, 19).replace('T', ' ');
        executeSql(`INSERT INTO users (username, created_at) VALUES("${this.username}", "${date}")`);
    }
}