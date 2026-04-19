import { executeSql } from './pyapi.js';
import TplNewUser from "./tpls/TplNewUser.js";

const app = document.getElementById('app');
app.innerHTML = '';

const checkUsers = await executeSql("SELECT COUNT(*) AS users_count FROM users");
if (checkUsers[0].users_count === 0) {
    app.append((await TplNewUser.create()).getElement());
}