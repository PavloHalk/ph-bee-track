export function notify(title, message, level) {
    if (!['info', 'success', 'warning', 'critical'].includes(level)) {
        level = 'info';
    }
    
    const el = document.createElement('div');
    el.className = 'py-1 px-2 notification notification-' + level;
    el.style.position = 'fixed';
    el.style.width = '350px';
    el.style.height = '80px';
    el.style.top = '30px';
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