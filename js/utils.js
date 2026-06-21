import { t } from './i18n.js';
import { APP_VERSION, APP_RELEASE_DATE, releaseHistory } from './version.js';

// Form field length limits (in characters) and the upper bound for goal hours.
export const MAX_NAME_LENGTH = 64;
export const MAX_DESCRIPTION_LENGTH = 500;
export const MAX_AIM_HOURS = 9999;

// Single-line text value: line breaks → space, trim the edges.
export function normalizeLine(value) {
    return (value ?? '').replace(/[\r\n]+/g, ' ').trim();
}

// Validates a required single-line field directly in the DOM: normalizes the value,
// shows a message under the field (in the adjacent .field-error-msg) and returns
// the cleaned value, or null if it is empty or too long.
// messages — already-translated strings { empty, tooLong }.
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

// Moves focus to the first (topmost in DOM order) invalid field inside the
// container, so the user can fix it right away. No-op if nothing is invalid.
export function focusFirstInvalid(container) {
    container.querySelector('.invalid')?.focus();
}

// Splits seconds into { h, m, s }.
export function secondsToParts(sec) {
    return {
        s: sec % 60,
        m: Math.floor((sec % 3600) / 60),
        h: Math.floor(sec / 3600),
    };
}

// Formats seconds as a clock "h:mm:ss".
export function secondsToClock(sec) {
    const { h, m, s } = secondsToParts(sec);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Time (current by default) as a string for SQLite: "YYYY-MM-DD HH:MM:SS".
export function toSqlDateTime(date = new Date()) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
}

// Distributes tracked time across the days of the given year. Returns
// { 'YYYY-MM-DD': seconds } for every day of the year (zeros included).
// Tracks are stored in UTC but displayed in the user's local time, so day
// boundaries are computed locally (DST-safe via Date arithmetic); a track that
// crosses local midnight is split between the adjacent days.
export function secondsPerDayOfYear(records, year) {
    const dayKey = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const result = {};
    const cursor = new Date(year, 0, 1);
    while (cursor.getFullYear() === year) {
        result[dayKey(cursor)] = 0;
        cursor.setDate(cursor.getDate() + 1);
    }

    const yearBegin = new Date(year, 0, 1).getTime();
    const yearEnd = new Date(year + 1, 0, 1).getTime();

    for (const rec of records) {
        const start = new Date(rec.started_at.replace(' ', 'T') + 'Z').getTime();
        const stop = new Date(rec.stopped_at.replace(' ', 'T') + 'Z').getTime();

        let from = Math.max(start, yearBegin);
        const to = Math.min(stop, yearEnd);
        if (from >= to) continue;

        // Walk local day by local day, splitting time at each local midnight.
        while (from < to) {
            const nextMidnight = new Date(from);
            nextMidnight.setHours(0, 0, 0, 0);
            nextMidnight.setDate(nextMidnight.getDate() + 1);
            const dayTo = Math.min(to, nextMidnight.getTime());

            const key = dayKey(new Date(from));
            if (key in result) result[key] += (dayTo - from) / 1000;

            from = dayTo;
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

// Version and date come from version-app.json (via version.js) — the single source of truth.
export const APP_AUTHOR = 'Галковський Павло Дмитрович';
export const APP_AUTHOR_EMAIL = 'pavelhalkovsky@gmail.com';
export const APP_GITHUB_URL = 'https://github.com/PavloHalk/ph-bee-track';
export const APP_LICENSE_NAME = 'PolyForm Noncommercial 1.0.0';
export const APP_LICENSE_URL = 'https://polyformproject.org/licenses/noncommercial/1.0.0';

// "About BeeTrack" modal window: logo, author, version with date, a GitHub link
// inviting people to join the development, and a single "OK" button.
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
        <p class="mb-1"><strong>${t('about.version')}:</strong> ${APP_VERSION} (${APP_RELEASE_DATE})</p>
        <p class="mb-3"><strong>${t('about.license')}:</strong>
            <a href="${APP_LICENSE_URL}" target="_blank">${APP_LICENSE_NAME}</a></p>
        <p class="mb-2">${t('about.contribute')}</p>
        <p class="mb-3 about-github">
            <a href="${APP_GITHUB_URL}" target="_blank" title="BeeTrack on GitHub">
                <img src="./img/github.png" alt="BeeTrack on GitHub" />
            </a>
        </p>
        <p class="m-0">
            <span class="btn btn-outline-primary btn-changelog me-2">${t('changelog.title')}</span>
            <span class="btn btn-primary btn-ok">${t('common.ok')}</span></p>`;

    const close = () => aboutContainer.remove();
    form.querySelector('.btn-ok').addEventListener('click', close);
    form.querySelector('.btn-changelog').addEventListener('click', showChangelog);

    aboutContainer.append(overlay);
    aboutContainer.append(form);

    document.body.append(aboutContainer);
}

// "Changelog" modal window: lists every release from version-app.json, newest first.
// Each release shows its version and date, then a list of changes; the body scrolls
// when the content is taller than the window.
export function showChangelog() {
    const changelogContainer = document.createElement('div');

    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.bottom = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.backgroundColor = 'black';
    overlay.style.opacity = '0.2';
    overlay.style.zIndex = '10002';

    const form = document.createElement('div');
    form.className = 'position-fixed top-50 start-50 translate-middle p-4 changelog-modal';
    form.style.zIndex = '10003';
    form.style.backgroundColor = 'white';
    form.style.border = '1px solid black';
    form.style.borderRadius = '10px';
    form.style.boxShadow = '0 0 30px black';

    const releasesHtml = releaseHistory.map((release) => `
        <div class="changelog-release">
            <p class="changelog-version">${release.version} (${release.date})</p>
            <hr>
            <ol>${(release.changes ?? []).map((change) => `<li>${change}</li>`).join('')}</ol>
        </div>`).join('');

    form.innerHTML = `
        <p class="h3 mb-3 text-center">${t('changelog.title')}</p>
        <div class="changelog-body">${releasesHtml}</div>
        <p class="m-0 text-center"><span class="btn btn-primary btn-ok">${t('common.ok')}</span></p>`;

    const close = () => changelogContainer.remove();
    form.querySelector('.btn-ok').addEventListener('click', close);

    changelogContainer.append(overlay);
    changelogContainer.append(form);

    document.body.append(changelogContainer);
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