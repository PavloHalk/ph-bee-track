import Tpl from './Tpl.js';
import User from '../models/User.js';
import { showSelectUser } from '../tplFunctions.js';
import { notifySuccess, validateRequiredLine, MAX_NAME_LENGTH } from '../utils.js';
import { t } from '../i18n.js';

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
            document.querySelector('.tpl-tasks')?.classList.remove('d-none');

            document.querySelector('header .btn-stat').classList.remove('d-none');
            document.querySelector('header .btn-tasks').classList.add('d-none');
        });

        btnLogout.addEventListener('click', async () => {
            this.delete();
            document.querySelector('header .profile').dataset.userId = 0;
            document.querySelector('header .profile').hidden = true;
            document.querySelector('.tpl-tasks')?.remove();
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
            if (!await handleUpdate()) return;
            this.delete();
            document.querySelector('.tpl-tasks')?.classList.remove('d-none');

            document.querySelector('header .btn-stat').classList.remove('d-none');
            document.querySelector('header .btn-tasks').classList.add('d-none');
        });
        
        setTimeout(() => {
            form.elements['username'].focus();
        }, 10);
        
        async function handleUpdate() {
            const username = validateRequiredLine(form.elements['username'], MAX_NAME_LENGTH, {
                empty: t('user.profile.errors.empty'),
                tooLong: t('user.profile.errors.tooLong', { max: MAX_NAME_LENGTH }),
            });
            if (username === null) return false;

            const profileElement = document.querySelector('header .profile');
            const user = await User.getById(profileElement.dataset.userId);

            user.username = username;
            try {
                await user.save();
                profileElement.dataset.username = user.username;
                profileElement.querySelector('.username').innerText = user.username;

                notifySuccess(
                    t('user.profile.updated.title'),
                    t('user.profile.updated.message')
                );
                return true;
            } catch {
                form.elements['username'].classList.add('invalid');
                form.elements['username'].nextElementSibling.innerText = t('user.profile.errors.exists');
                return false;
            }
        }
    }
}