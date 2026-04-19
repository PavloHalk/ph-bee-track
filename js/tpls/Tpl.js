import { loadHtml } from '../pyapi.js';

export default class Tpl {
    #el = null;
    
    constructor() {
        if (new.target === Tpl) throw new Error("Creating instances of Tpl class is restricted. Create children instead.");
        
        this.#el = document.createElement('div');
        this.#el.className = this.classAttr;
    }
    
    static async create() {
        const tpl = new this();
        tpl.getElement().innerHTML = await loadHtml(this.htmlPath);
        return tpl;
    }

    static get htmlPath() {
        return 'base';
    }

    static get classAttr() {
        return 'tpl';
    }
    
    getElement() {
        return this.#el;
    }
    
    show() {
        this.#el.hidden = false;
    }
    
    hide() {
        this.#el.hidden = true;
    }
}