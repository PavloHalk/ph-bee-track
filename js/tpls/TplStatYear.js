import Tpl from './Tpl.js';

export default class TplStatYear extends Tpl {
    static get htmlPath() {
        return 'stat-task-year';
    }
    
    get classAttr() {
        return 'tpl tpl-stat-year';
    }
}