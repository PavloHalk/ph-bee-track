import Tpl from './Tpl.js';
import User from '../Models/User.js';

export default class TplNewUser extends Tpl {
    static get htmlPath() {
        return 'new-user';
    }

    static get classAttr() {
        return 'tpl tpl-new-user';
    }
    
    init() {
        this.getElement().querySelector('form').addEventListener('submit', (event) => {
            event.preventDefault();

            const user = new User();
            user.username = event.currentTarget.elements['username'].value;
            console.log(user.username);
            user.save();
        });
    }
}