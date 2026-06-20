import { loadConfig, saveConfig } from './pyapi.js';
import ua from '../lang/ua.js';

export const DEFAULT_LANGUAGE = 'ua';
// name — the language's own native name: that is exactly how it shows in the selector.
export const availableLanguages = [
    { code: 'ua', name: 'Українська' },
    { code: 'en', name: 'English' },
    { code: 'pl', name: 'Polski' },
    { code: 'de', name: 'Deutsch' },
    { code: 'cs', name: 'Čeština' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'pt-br', name: 'Português (Brasil)' },
    { code: 'it', name: 'Italiano' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'zh', name: '简体中文' },
    { code: 'ja', name: '日本語' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'bn', name: 'বাংলা' },
    { code: 'ko', name: '한국어' },
];

const dictionaries = { ua };
let currentLanguage = DEFAULT_LANGUAGE;

export async function initI18n() {
    const config = await loadConfig();

    if (!config.lang) {
        config.lang = DEFAULT_LANGUAGE;
        await saveConfig(config);
    }

    await applyLanguage(config.lang);
}

export async function setLanguage(code) {
    await applyLanguage(code);

    const config = await loadConfig();
    config.lang = currentLanguage;
    await saveConfig(config);

    document.dispatchEvent(new CustomEvent('language-changed', { detail: { language: currentLanguage } }));
}

export function getLanguage() {
    return currentLanguage;
}

export function t(path, params = {}) {
    const value = path.split('.').reduce(
        (level, key) => (level && typeof level === 'object') ? level[key] : undefined,
        dictionaries[currentLanguage]
    );

    if (value === undefined) {
        console.warn(`Missing translation for "${path}" (${currentLanguage}).`);
        return path;
    }

    if (typeof value !== 'string') return value;

    return value.replace(/\{(\w+)}/g, (match, key) => key in params ? params[key] : match);
}

export function translateDom(root) {
    for (const el of root.querySelectorAll('[data-i18n]')) {
        el.innerText = t(el.dataset.i18n);
    }
    for (const el of root.querySelectorAll('[data-i18n-title]')) {
        el.title = t(el.dataset.i18nTitle);
    }
    for (const el of root.querySelectorAll('[data-i18n-aria-label]')) {
        el.setAttribute('aria-label', t(el.dataset.i18nAriaLabel));
    }
}

async function applyLanguage(code) {
    if (!dictionaries[code]) {
        try {
            dictionaries[code] = (await import(`../lang/${code}.js`)).default;
        } catch (err) {
            console.error(`Unable to load language "${code}", falling back to "${DEFAULT_LANGUAGE}".`, err);
            code = DEFAULT_LANGUAGE;
        }
    }

    currentLanguage = code;
    document.documentElement.lang = code;
    translateDom(document);
}