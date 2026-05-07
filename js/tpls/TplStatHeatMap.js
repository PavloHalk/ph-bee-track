import Tpl from './Tpl.js';

export default class TplStatHeatMap extends Tpl {
    static get htmlPath() {
        return 'stat-heat-map';
    }
    
    get classAttr() {
        return 'tpl tpl-stat-heat-map';
    }
}