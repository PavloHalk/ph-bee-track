import Tpl from './Tpl.js';
import User from '../Models/User.js';
import {notifySuccess} from "../utils.js";

export default class TplNewUser extends Tpl {
    static get htmlPath() {
        return 'new-user';
    }

    get classAttr() {
        return 'tpl tpl-new-user';
    }
    
    init() {
        const form = this.getElement().querySelector('form');
        const btn = this.getElement().querySelector('.btn-submit');
        
        form.addEventListener('submit', (event) => event.preventDefault());
        
        btn.addEventListener('click', (event) => {
            const currentTarget = event.target.closest('form');
            
            if (!currentTarget.elements['username'].value) {
                currentTarget.elements['username'].classList.add('invalid');
                currentTarget.elements['username'].nextElementSibling.innerText = "Незаповнене поле.";
                return;
            }

            let user = new User();
            user.username = currentTarget.elements['username'].value;
            user.save() //@todo: use async/await
                .then(async () => {
                    const ev = new CustomEvent(
                        'user-created',
                        { bubbles: true }
                    );
                    btn.closest('.tpl').dispatchEvent(ev);
                    
                    const profile = document.querySelector('header .profile');
                    user = await User.getByUserName(user.username);
                    profile.querySelector('.username').innerText = user.username;
                    profile.dataset.userId = user.id;
                    profile.dataset.username = user.username;
                    profile.dataset.registrationDate = user.created_at;
                    profile.hidden = false;
                    
                    this.delete();

                    notifySuccess(
                        'Бджілка створена',
                        'Вітаю! Ви щойно створили нову бджілку з іменем "'+user.username+'" і увійшли в систему.'
                    );
                })
                .catch(err => {
                    console.error(err);
                    currentTarget.elements['username'].classList.add('invalid');
                    currentTarget.elements['username'].nextElementSibling.innerText = "Така бджілка вже існує.";
                });
        });
        
        form.elements['username'].addEventListener('input', (event) => {
            event.target.classList.remove('invalid');
            event.target.nextElementSibling.innerText = '';
        });

        form.elements['username'].addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                btn.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
            }
        });
        
        setTimeout(() => {
            form.elements['username'].focus();
        });
    }
}