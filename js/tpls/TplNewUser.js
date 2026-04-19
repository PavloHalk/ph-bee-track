import Tpl from './Tpl.js';
import User from '../Models/User.js';

export default class TplNewUser extends Tpl {
    static get htmlPath() {
        return 'new-user';
    }

    get classAttr() {
        return 'tpl tpl-new-user';
    }
    
    init() {
        const form = this.getElement().querySelector('form');
        
        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const currentTarget = event.currentTarget;
            
            if (!currentTarget.elements['username'].value) {
                currentTarget.elements['username'].classList.add('invalid');
                currentTarget.elements['username'].nextElementSibling.innerText = "Незаповнене поле.";
                return;
            }

            const user = new User();
            user.username = currentTarget.elements['username'].value;
            user.save()
                .then(() => {
                    const ev = new CustomEvent(
                        'user-created',
                        { bubbles: true }
                    );
                    form.closest('.tpl').dispatchEvent(ev);
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
    }
}