import TplNewUser from './tpls/TplNewUser.js';
import TplSelectUser from './tpls/TplSelectUser.js';
import TplUserProfile from './tpls/TplUserProfile.js';
import TplCurrentTask from './tpls/TplCurrentTask.js';
import TplTasks from './tpls/TplTasks.js';

const app = document.getElementById('app');

export async function showCreateUser() {
    const tpl = await TplNewUser.create();
    app.append(tpl.getElement());
}

export async function showSelectUser() {
    app.innerHTML = '';
    const tpl = await TplSelectUser.create();
    app.append(tpl.getElement());
}

export async function showUserProfile() {
    app.querySelector('.tpl-user-profile')?.remove();
    const tpl = await TplUserProfile.create();
    app.append(tpl.getElement());
}

export async function showCurrentTask(userId) {
    app.querySelector('.tpl-current-task')?.remove();
    
    const tpl = await TplCurrentTask.create(userId);
    app.append(tpl.getElement());
}

export async function showTasks(userId, timer) {
    app.innerHTML = '';
    const tpl = await TplTasks.create(userId, timer);
    app.append(tpl.getElement());
}