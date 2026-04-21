import TplNewUser from "./tpls/TplNewUser.js";
import TplSelectUser from "./tpls/TplSelectUser.js";
import TplUserProfile from "./tpls/TplUserProfile.js";

const app = document.getElementById('app');

export async function showCreateUser() {
    const tpl = await TplNewUser.create();
    app.append(tpl.getElement());
}

export async function showSelectUser() {
    const tpl = await TplSelectUser.create();
    app.append(tpl.getElement());
}

export async function showUserProfile() {
    app.innerHTML = '';
    const tpl = await TplUserProfile.create();
    app.append(tpl.getElement());
}