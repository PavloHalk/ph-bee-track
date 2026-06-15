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