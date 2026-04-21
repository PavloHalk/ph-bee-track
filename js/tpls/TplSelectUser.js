import Tpl from './Tpl.js';
import User from '../Models/User.js';
import { showCreateUser } from "../tplFunctions.js";

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
        
        template.addEventListener('click', () => {
            this.delete();
            showCreateUser();
        })
    }
}