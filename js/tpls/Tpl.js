import { loadHtml } from '../pyapi.js';
import { translateDom } from '../i18n.js';

export default class Tpl {
    #el = null;
    #langListener = null;

    constructor() {
        if (new.target === Tpl) throw new Error("Creating instances of Tpl class is restricted. Create children instead.");

        this.#el = document.createElement('div');
        this.#el.className = this.classAttr;

        this.#langListener = () => {
            if (!this.#el) {
                document.removeEventListener('language-changed', this.#langListener);
                return;
            }
            if (!this.#el.isConnected) return;
            this.onLanguageChanged();
        };
        document.addEventListener('language-changed', this.#langListener);
    }

    static async create() {
        const tpl = new this();
        tpl.getElement().innerHTML = await loadHtml(this.htmlPath);
        translateDom(tpl.getElement());
        tpl.init(...arguments);
        return tpl;
    }

    static get htmlPath() {
        return 'base';
    }

    get classAttr() {
        return 'tpl';
    }

    getElement() {
        return this.#el;
    }

    init() {
        throw new Error('You have to implement this method in child class.');
    }

    // Elements with data-i18n are translated by the global translateDom. This hook is
    // for content the template renders itself in JS (month names, legends, etc.).
    onLanguageChanged() {}

    show() {
        this.#el.hidden = false;
    }

    hide() {
        this.#el.hidden = true;
    }

    delete() {
        document.removeEventListener('language-changed', this.#langListener);
        this.#el.remove();
        this.#el = null;
    }
}