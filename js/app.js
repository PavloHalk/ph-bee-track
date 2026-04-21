import { executeSql } from "./pyapi.js";
import { showCreateUser, showSelectUser } from "./tplFunctions.js";

const app = document.getElementById('app');
app.innerHTML = '';

const checkUsers = await executeSql("SELECT COUNT(*) AS users_count FROM users");
if (checkUsers[0].users_count === 0) {
    await showCreateUser();
} else {
    await showSelectUser();
}