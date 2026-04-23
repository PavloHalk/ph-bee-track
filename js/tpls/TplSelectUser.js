import Tpl from './Tpl.js';
import User from '../Models/User.js';
import { showCreateUser } from "../tplFunctions.js";
import { loadConfig, saveConfig } from "../pyapi.js";

export default class TplSelectUser extends Tpl {
    static get htmlPath() {
        return 'select-user';
    }
    
    get classAttr() {
        return 'tpl tpl-select-user';
    }
    
    async init() {
        const users = await User.all();

        const container = this.getElement().querySelector('.user-container');
        const template = container.querySelector('.user');

        for (const user of users) {
            const userElement = template.cloneNode(true);
            userElement.querySelector('img').src = '../img/profile.png';
            userElement.querySelector('.username').innerText = user.username;
            userElement.dataset.userId = user.id;

            container.prepend(userElement);
        }

        container.addEventListener('click', async (event) => {
            if (!event.target.closest('.user')) return;
            if (!event.target.closest('.user').dataset.userId) return;
            
            const user = await User.getById(event.target.closest('.user').dataset.userId);
            const profile = document.querySelector('header .profile');
            profile.querySelector('.username').innerText = user.username;
            profile.dataset.userId = user.id;
            profile.dataset.username = user.username;
            profile.dataset.registrationDate = user.created_at;
            profile.hidden = false;
            
            this.delete();
            
            const config = await loadConfig();
            config.last_logged_user_id = user.id;
            await saveConfig(config);
        });
        
        template.addEventListener('click', () => {
            this.delete();
            showCreateUser();
        });
    }
}