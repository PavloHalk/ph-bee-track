import Tpl from './Tpl.js';

export default class TplNewUser extends Tpl {
    static get htmlPath() {
        return 'new-user';
    }

    static get classAttr() {
        return 'tpl tpl-new-user';
    }
}