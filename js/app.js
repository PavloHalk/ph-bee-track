import { executeSql } from './pyapi.js';
import TplNewUser from "./tpls/TplNewUser.js";
import TplSelectUser from "./tpls/TplSelectUser.js";

const app = document.getElementById('app');
app.innerHTML = '';

const checkUsers = await executeSql("SELECT COUNT(*) AS users_count FROM users");
if (checkUsers[0].users_count === 0) {
    await showCreateNewUser();
} else {
    await showSelectUser();
}

async function showCreateNewUser() {
    const tpl = await TplNewUser.create();
    app.append(tpl.getElement());
    tpl.getElement().addEventListener('user-created', () => {
        tpl.delete();
        showSelectUser();
    });
}

async function showSelectUser() {
    const tpl = await TplSelectUser.create();
    app.append(tpl.getElement());
}