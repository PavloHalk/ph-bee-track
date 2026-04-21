import TplNewUser from "./tpls/TplNewUser.js";
import TplSelectUser from "./tpls/TplSelectUser.js";

const app = document.getElementById('app');

export async function showCreateUser() {
    const tpl = await TplNewUser.create();
    app.append(tpl.getElement());
    tpl.getElement().addEventListener('user-created', () => {
        tpl.delete();
        showSelectUser();
    });
}

export async function showSelectUser() {
    const tpl = await TplSelectUser.create();
    app.append(tpl.getElement());
}