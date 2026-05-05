import TplNewUser from './tpls/TplNewUser.js';
import TplSelectUser from './tpls/TplSelectUser.js';
import TplUserProfile from './tpls/TplUserProfile.js';
import TplStatTaskTotal from './tpls/TplStatTaskTotal.js';
import TplTasks from './tpls/TplTasks.js';

const app = document.getElementById('app');

export async function showCreateUser(showCancelButton = true) {
    const tpl = await TplNewUser.create(showCancelButton);
    app.append(tpl.getElement());
}

export async function showSelectUser() {
    app.innerHTML = '';
    const tpl = await TplSelectUser.create();
    app.append(tpl.getElement());
}

export async function showUserProfile() {
    app.querySelector('.tpl-tasks')?.classList.add('d-none');
    app.querySelector('.tpl-user-profile')?.remove();
    app.querySelector('.tpl-stat-task-total')?.remove();
    const tpl = await TplUserProfile.create();
    app.append(tpl.getElement());

    document.querySelector('header .btn-stat').classList.remove('d-none');
    document.querySelector('header .btn-tasks').classList.remove('d-none');
}

export async function showTasks(userId, timer) {
    const tpls = document.querySelectorAll('.tpl');
    
    for (const tpl of tpls) {
        if (tpl.classList.contains('tpl-tasks')) {
            tpl.classList.remove('d-none');
        } else {
            tpl.remove();
        }
    }
    
    if (!document.querySelector('.tpl-tasks')) {
        const tpl = await TplTasks.create(userId, timer);
        app.append(tpl.getElement());
    }

    document.querySelector('header .btn-stat').classList.remove('d-none');
    document.querySelector('header .btn-tasks').classList.add('d-none');
}

export async function showStats(userId) {
    const tpls = document.querySelectorAll('.tpl');
    
    for (const tpl of tpls) {
        if (tpl.classList.contains('tpl-tasks')) {
            tpl.classList.add('d-none');
        } else {
            tpl.remove();
        }
    }
    
    const tpl = await TplStatTaskTotal.create(userId);
    app.append(tpl.getElement());

    document.querySelector('header .btn-stat').classList.add('d-none');
    document.querySelector('header .btn-tasks').classList.remove('d-none');
}