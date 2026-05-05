import { executeSql, loadConfig } from './pyapi.js';
import {showCreateUser, showSelectUser, showUserProfile, showTasks, showStats} from './tplFunctions.js';
import User from './models/User.js';
import Timer from './Timer.js';

const config = await loadConfig();
const timer = new Timer();

const profileElement = document.querySelector('header .profile');
const profileObserver = new MutationObserver(async (mutations) => {
    if (Number(mutations[0].target.dataset.userId) === 0) {
        timer.stop();
        document.querySelector('header .btn-stat').classList.add('d-none');
        document.querySelector('header .btn-tasks').classList.add('d-none');
        return;
    }

    await showTasks(mutations[0].target.dataset.userId, timer);
});
profileObserver.observe(profileElement, { attributes: true, attributeFilter: ['data-user-id'] });

const checkUsers = await executeSql("SELECT COUNT(*) AS users_count FROM users");
if (!checkUsers[0].users_count) {
    await showCreateUser(true);
} else {
    if (!config.last_logged_user_id) {
        await showSelectUser();
    } else {
        const user = await User.getById(config.last_logged_user_id);
        const profile = document.querySelector('header .profile');
        
        profile.querySelector('.username').innerText = user.username;
        profile.dataset.userId = user.id;
        profile.dataset.username = user.username;
        profile.dataset.registrationDate = user.created_at;
        profile.hidden = false;
    }
}

document.querySelector('header .profile').addEventListener('click', async () => {
    await showUserProfile();
});

document.querySelector('header .btn-stat').addEventListener('click', async () => {
    await showStats(document.querySelector('header .profile').dataset.userId);
});
document.querySelector('header .btn-tasks').addEventListener('click', async () => {
    await showTasks(document.querySelector('header .profile').dataset.userId, timer);
});