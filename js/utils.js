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
    form.className = 'position-absolute top-50 start-50 translate-middle p-4';
    form.style.zIndex = '10001';
    form.style.backgroundColor = 'white';
    form.style.border = '1px solid black';
    form.style.borderRadius = '10px';
    form.style.boxShadow = '0 0 30px black';
    form.innerHTML = `<p class="h3">${title}</p><p>${text}</p><p><span class="btn btn-primary btn-confirm me-2">Так</span><span class="btn btn-outline-primary btn-cancel">Скасувати</span></p>`;

    form.querySelector('.btn-confirm').addEventListener('click', okCallback);
    form.querySelector('.btn-confirm').addEventListener('click', () => confirmContainer.remove());

    form.querySelector('.btn-cancel').addEventListener('click', cancelCallback);
    form.querySelector('.btn-cancel').addEventListener('click', () => confirmContainer.remove());
    
    confirmContainer.append(overlay);
    confirmContainer.append(form);
    
    document.body.append(confirmContainer);
}