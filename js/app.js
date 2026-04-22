import { executeSql } from "./pyapi.js";
import {showCreateUser, showSelectUser, showUserProfile, showCurrentTask} from "./tplFunctions.js";

const profileElement = document.querySelector('header .profile');
const profileObserver = new MutationObserver(async (mutations) => {
    await showCurrentTask(mutations[0].target.dataset.userId);
});
profileObserver.observe(profileElement, { attributes: true, attributeFilter: ['data-user-id'] });

const checkUsers = await executeSql("SELECT COUNT(*) AS users_count FROM users");
if (checkUsers[0].users_count === 0) {
    await showCreateUser();
} else {
    await showSelectUser();
}

document.querySelector('header .profile').addEventListener('click', async () => {
    await showUserProfile();
});