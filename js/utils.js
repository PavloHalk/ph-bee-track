import { t } from './i18n.js';

// Межі довжини полів форм (у символах) та верхня межа годин цілі.
export const MAX_NAME_LENGTH = 64;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_AIM_HOURS = 9999;

// Однорядкове текстове значення: переноси рядків → пробіл, краї обрізаємо.
export function normalizeLine(value) {
    return (value ?? '').replace(/[\r\n]+/g, ' ').trim();
}

// Валідує обов'язкове однорядкове поле прямо в DOM: нормалізує значення,
// показує повідомлення під полем (у сусідньому .field-error-msg) і повертає
// очищене значення або null, якщо воно порожнє чи задовге.
// messages — вже перекладені рядки { empty, tooLong }.
export function validateRequiredLine(input, maxLength, messages) {
    const value = normalizeLine(input.value);
    input.value = value;

    if (!value) {
        input.classList.add('invalid');
        input.nextElementSibling.innerText = messages.empty;
        return null;
    }
    if (value.length > maxLength) {
        input.classList.add('invalid');
        input.nextElementSibling.innerText = messages.tooLong;
        return null;
    }
    return value;
}

// Розкладає секунди на { h, m, s }.
export function secondsToParts(sec) {
    return {
        s: sec % 60,
        m: Math.floor((sec % 3600) / 60),
        h: Math.floor(sec / 3600),
    };
}

// Форматує секунди як годинник "h:mm:ss".
export function secondsToClock(sec) {
    const { h, m, s } = secondsToParts(sec);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Час (за замовчуванням поточний) як рядок для SQLite: "YYYY-MM-DD HH:MM:SS".
export function toSqlDateTime(date = new Date()) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

// Розподіляє відстежений час по днях указаного року. Повертає
// { 'YYYY-MM-DD': seconds } для кожного дня року (нульові — включно).
// Треки зберігаються в UTC, тож і межі днів рахуємо в UTC; трек, що
// перетинає північ, ділиться між сусідніми днями.
export function secondsPerDayOfYear(records, year) {
    const DAY_MS = 86400_000;
    const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
    const daysInYear = isLeap(year) ? 366 : 365;

    const result = {};
    for (let i = 0; i < daysInYear; i++) {
        const d = new Date(Date.UTC(year, 0, 1 + i));
        result[d.toISOString().slice(0, 10)] = 0;
    }

    const yearBegin = Date.UTC(year, 0, 1);
    const yearEnd = Date.UTC(year + 1, 0, 1);

    for (const rec of records) {
        const start = new Date(rec.started_at.replace(' ', 'T') + 'Z').getTime();
        const stop = new Date(rec.stopped_at.replace(' ', 'T') + 'Z').getTime();

        const from = Math.max(start, yearBegin);
        const to = Math.min(stop, yearEnd);
        if (from >= to) continue;

        const firstDayMs = Math.floor(from / DAY_MS) * DAY_MS;
        for (let dayMs = firstDayMs; dayMs < to; dayMs += DAY_MS) {
            const dayKey = new Date(dayMs).toISOString().slice(0, 10);
            if (!(dayKey in result)) continue;

            const dayFrom = Math.max(from, dayMs);
            const dayTo = Math.min(to, dayMs + DAY_MS);
            result[dayKey] += (dayTo - dayFrom) / 1000;
        }
    }

    return result;
}

export function notify(title, message, level) {
    if (!['info', 'success', 'warning', 'critical'].includes(level)) {
        level = 'info';
    }
    
    let lastNotificationBottom = 0;
    const notifications = document.querySelectorAll('.notification');
    
    if (notifications.length) {
        const lastNotification = notifications[notifications.length - 1];
        lastNotificationBottom = lastNotification.getBoundingClientRect().bottom;
    }
    
    const el = document.createElement('div');
    el.className = 'py-1 px-2 notification notification-' + level;
    el.style.position = 'fixed';
    el.style.width = '350px';
    el.style.height = '80px';
    el.style.borderRadius = '5px';
    el.style.top = lastNotificationBottom + 30 + 'px';
    el.style.right = '30px'
    el.style.opacity = '0.0';
    el.style.fontSize = '90%';
    el.style.boxShadow = '0 0 10px black';
    
    if (level === 'info') {
        el.classList.add('bg-dark-subtle');
    }
    if (level === 'success') {
        el.classList.add('bg-success');
        el.classList.add('text-light');
    }
    if (level === 'warning') {
        el.classList.add('bg-warning');
    }
    if (level === 'critical') {
        el.classList.add('bg-danger');
        el.classList.add('text-light');
    }
    
    const progress = document.createElement('div');
    progress.style.position = 'absolute';
    progress.style.left = '0';
    progress.style.bottom = '0';
    progress.style.height = '4px';
    progress.style.width = '100%';
    progress.style.backgroundColor = 'black';
    progress.style.opacity = '0.2';
    
    el.innerHTML = `<p class="m-0"><strong>${title}</strong></p><p class=" m-0">${message}</p>`;
    el.append(progress);
    
    document.body.append(el);
    
    let opacity = 0;
    const showInterval = setInterval(() => {
        if (opacity >= 90) {
            clearInterval(showInterval);
        } else {
            el.style.opacity = '0.' + opacity.toString().padStart(2, '0');
            opacity += 1;
        }
    }, 5);
    
    let progressWidth = 100.0;
    const progressInterval = setInterval(() => {
        if (progressWidth <= 0) {
            clearInterval(progressInterval);
            hide();
        } else {
            progressWidth -= 0.2;
            progress.style.width = progressWidth + '%';
        }
    }, 10);
    
    const positionInterval = setInterval(() => {
        if (!el.isConnected) {
            clearInterval(positionInterval);
        }
        
        const elRect = el.getBoundingClientRect();
        const elPrev = el.previousElementSibling;
        
        let neededPosition = 30;
        if (elPrev && elPrev.classList.contains('notification') && elPrev.isConnected) {
            neededPosition = elPrev.getBoundingClientRect().bottom + 30;
        }
        
        if (elRect.top > neededPosition) {
            el.style.top = elRect.top - 2 + 'px';
        }
    }, 1);
    
    function hide() {
        const hideInterval = setInterval(() => {
            if (opacity <= 0) {
                clearInterval(hideInterval);
                el.remove();
            } else {
                el.style.opacity = '0.' + opacity.toString().padStart(2, '0');
                opacity -= 1;
            }
        }, 5);
    }
}

export function notifyInfo(title, message) {
    notify(title, message, 'info');
}

export function notifySuccess(title, message) {
    notify(title, message, 'success');
}

export function notifyWarning(title, message) {
    notify(title, message, 'warning');
}

export function notifyCritical(title, message) {
    notify(title, message, 'critical');
}

// Поточна версія програми та дата її випуску — поки що жорстко зашиті.
export const APP_VERSION = '0.6.0';
export const APP_RELEASE_DATE = '2026-06-20';
export const APP_AUTHOR = 'Галковський Павло Дмитрович';
export const APP_AUTHOR_EMAIL = 'pavelhalkovsky@gmail.com';
export const APP_GITHUB_URL = 'https://github.com/PavloHalk/ph-bee-track';

// Модальне вікно "Про BeeTrack": логотип, автор, версія з датою, посилання
// на GitHub із запрошенням долучитися до розробки та єдина кнопка "Ок".
export function showAbout() {
    const aboutContainer = document.createElement('div');

    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.bottom = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.backgroundColor = 'black';
    overlay.style.opacity = '0.2';
    overlay.style.zIndex = '10000';

    const form = document.createElement('div');
    form.className = 'position-fixed top-50 start-50 translate-middle p-4 text-center about-modal';
    form.style.zIndex = '10001';
    form.style.backgroundColor = 'white';
    form.style.border = '1px solid black';
    form.style.borderRadius = '10px';
    form.style.boxShadow = '0 0 30px black';
    form.style.maxWidth = '420px';

    form.innerHTML = `
        <p class="m-0"><img class="about-logo" src="./img/logo.png" alt="BeeTrack logo" /></p>
        <p class="h3 mt-2">${t('about.title')}</p>
        <p class="mb-1"><strong>${t('about.author')}:</strong><br>${APP_AUTHOR}<br>
            <a href="mailto:${APP_AUTHOR_EMAIL}">${APP_AUTHOR_EMAIL}</a></p>
        <p class="mb-3"><strong>${t('about.version')}:</strong> ${APP_VERSION} (${APP_RELEASE_DATE})</p>
        <p class="mb-2">${t('about.contribute')}</p>
        <p class="mb-3 about-github">
            <a href="${APP_GITHUB_URL}" target="_blank" title="BeeTrack on GitHub">
                <img src="./img/github.png" alt="BeeTrack on GitHub" />
            </a>
        </p>
        <p class="m-0"><span class="btn btn-primary btn-ok">${t('common.ok')}</span></p>`;

    const close = () => aboutContainer.remove();
    form.querySelector('.btn-ok').addEventListener('click', close);

    aboutContainer.append(overlay);
    aboutContainer.append(form);

    document.body.append(aboutContainer);
}

export function showConfirm(title, text, okCallback, cancelCallback) {
    if (!okCallback) okCallback = () => {}
    if (!cancelCallback) cancelCallback = () => {}
    
    const confirmContainer = document.createElement('div');
    
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.bottom = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.backgroundColor = 'black';
    overlay.style.opacity = '0.2';
    overlay.style.zIndex = '10000';
    
    const form = document.createElement('div');
    form.className = 'position-fixed top-50 start-50 translate-middle p-4';
    form.style.zIndex = '10001';
    form.style.backgroundColor = 'white';
    form.style.border = '1px solid black';
    form.style.borderRadius = '10px';
    form.style.boxShadow = '0 0 30px black';
    form.innerHTML = `<p class="h3">${title}</p><p>${text}</p><p><span class="btn btn-primary btn-confirm me-2">${t('common.yes')}</span><span class="btn btn-outline-primary btn-cancel">${t('common.cancel')}</span></p>`;

    form.querySelector('.btn-confirm').addEventListener('click', okCallback);
    form.querySelector('.btn-confirm').addEventListener('click', () => confirmContainer.remove());

    form.querySelector('.btn-cancel').addEventListener('click', cancelCallback);
    form.querySelector('.btn-cancel').addEventListener('click', () => confirmContainer.remove());
    
    confirmContainer.append(overlay);
    confirmContainer.append(form);
    
    document.body.append(confirmContainer);
}