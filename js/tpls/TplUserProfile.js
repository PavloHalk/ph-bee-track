import Tpl from './Tpl.js';
import User from '../models/User.js';
import { showSelectUser } from '../tplFunctions.js';
import { notifySuccess } from '../utils.js';

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
        
        const btnUpdate = form.querySelector('.btn-update');
        const btnUpdateClose = form.querySelector('.btn-update-close');
        const btnCancel = form.querySelector('.btn-cancel');
        const btnLogout = form.querySelector('.btn-logout');
        
        form.elements['username'].value = profileElement.dataset.username;
        form.elements['reg_date'].value = profileElement.dataset.registrationDate;
        
        btnCancel.addEventListener('click', () => {
            this.delete();
        });

        btnLogout.addEventListener('click', async () => {
            this.delete();
            document.querySelector('header .profile').hidden = true;
            await showSelectUser();
        });
        
        form.elements['username'].addEventListener('input', (event) => {
            event.target.classList.remove('invalid');
            event.target.nextElementSibling.innerText = '';
        });
        
        btnUpdate.addEventListener('click', async () => {
            await handleUpdate();
        });
        btnUpdateClose.addEventListener('click', async () => {
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
                
                notifySuccess(
                    'Бджілка оновлена',
                    'Дані вашої бджілки були успішно оновлені.'
                );
            } catch {
                form.elements['username'].classList.add('invalid');
                form.elements['username'].nextElementSibling.innerText = "Така бджілка вже існує.";
            }
        }
    }
}