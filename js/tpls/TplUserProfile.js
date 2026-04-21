import Tpl from './Tpl.js';
import User from '../models/User.js';
import { showSelectUser } from '../tplFunctions.js';
import { notify } from '../utils.js';

export default class TplUserProfile extends Tpl {
    static get htmlPath() {
        return 'user-profile';
    }

    get classAttr() {
        return 'tpl tpl-user-profile';
    }
    
    init() {
        const profileElement = document.querySelector('header .profile');
        const form = this.getElement().querySelector("form[name='user-profile']");
        
        form.elements['username'].value = profileElement.dataset.username;
        form.elements['reg_date'].value = profileElement.dataset.registrationDate;
        
        form.elements['btn-cancel'].addEventListener('click', () => {
            this.delete();
        });

        form.elements['btn-logout'].addEventListener('click', async () => {
            this.delete();
            document.querySelector('header .profile').hidden = true;
            await showSelectUser();
        });
        
        form.elements['username'].addEventListener('input', (event) => {
            event.target.classList.remove('invalid');
            event.target.nextElementSibling.innerText = '';
        });
        
        form.elements['btn-update'].addEventListener('click', async () => {
            await handleUpdate();
        });
        form.elements['btn-update-close'].addEventListener('click', async () => {
            await handleUpdate();
            this.delete();
        });
        
        async function handleUpdate() {
            if (!form.elements['username'].value) {
                form.elements['username'].classList.add('invalid');
                form.elements['username'].nextElementSibling.innerText = "У бджілки має бути ім'я.";
                return;
            }

            const profileElement = document.querySelector('header .profile');
            const user = await User.getById(profileElement.dataset.userId);

            user.username = form.elements['username'].value;
            try {
                await user.save();
                profileElement.dataset.username = user.username;
                profileElement.querySelector('.username').innerText = user.username;
                
                notify(
                    'Бджілка оновлена',
                    'Дані вашої бджілки були успішно оновлені.',
                    'success'
                );
            } catch {
                form.elements['username'].classList.add('invalid');
                form.elements['username'].nextElementSibling.innerText = "Така бджілка вже існує.";
            }
        }
    }
}