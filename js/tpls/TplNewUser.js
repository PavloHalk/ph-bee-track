import Tpl from './Tpl.js';
import User from '../Models/User.js';
import {notifySuccess, validateRequiredLine, MAX_NAME_LENGTH} from "../utils.js";
import {showSelectUser} from "../tplFunctions.js";
import { t } from '../i18n.js';

export default class TplNewUser extends Tpl {
    static get htmlPath() {
        return 'new-user';
    }

    get classAttr() {
        return 'tpl tpl-new-user';
    }
    
    init(showCancelButton = true) {
        const form = this.getElement().querySelector('form');
        const btnSubmit = this.getElement().querySelector('.btn-submit');
        const btnCancel = this.getElement().querySelector('.btn-cancel');
        
        if (!showCancelButton) {
            btnCancel.classList.add('d-none');
        }
        
        form.addEventListener('submit', (event) => event.preventDefault());
        
        btnSubmit.addEventListener('click', (event) => {
            const currentTarget = event.target.closest('form');

            const username = validateRequiredLine(currentTarget.elements['username'], MAX_NAME_LENGTH, {
                empty: t('user.create.errors.empty'),
                tooLong: t('user.create.errors.tooLong', { max: MAX_NAME_LENGTH }),
            });
            if (username === null) return;

            let user = new User();
            user.username = username;
            user.save() //@todo: use async/await
                .then(async () => {
                    const ev = new CustomEvent(
                        'user-created',
                        { bubbles: true }
                    );
                    btnSubmit.closest('.tpl').dispatchEvent(ev);
                    
                    const profile = document.querySelector('header .profile');
                    user = await User.getByUserName(user.username);
                    profile.querySelector('.username').innerText = user.username;
                    profile.dataset.userId = user.id;
                    profile.dataset.username = user.username;
                    profile.dataset.registrationDate = user.created_at;
                    profile.hidden = false;
                    
                    this.delete();

                    notifySuccess(
                        t('user.create.created.title'),
                        t('user.create.created.message', { name: user.username })
                    );
                })
                .catch(err => {
                    console.error(err);
                    currentTarget.elements['username'].classList.add('invalid');
                    currentTarget.elements['username'].nextElementSibling.innerText = t('user.create.errors.exists');
                });
        });
        
        btnCancel.addEventListener('click', async () => {
            this.delete();
            await showSelectUser(showCancelButton);
        });
        
        form.elements['username'].addEventListener('input', (event) => {
            event.target.classList.remove('invalid');
            event.target.nextElementSibling.innerText = '';
        });

        form.elements['username'].addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                btnSubmit.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
            }
        });
        
        setTimeout(() => {
            form.elements['username'].focus();
        });
    }
}