import Tpl from './Tpl.js';

export default class TplStatWeekCalendar extends Tpl {
    static get htmlPath() {
        return 'stat-week-calendar';
    }

    get classAttr() {
        return 'tpl tpl-stat-week-calendar';
    }
    
    async init(userId) {
        console.log(userId);
    }
}