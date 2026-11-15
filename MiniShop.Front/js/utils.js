// Общие утилиты: escapeHtml для защиты от XSS и toast-уведомления

export function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

export function showToast(message, type = 'success') {
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;

    // textContent вместо innerHTML — сообщение не может содержать HTML/скрипты
    const text = document.createElement('span');
    text.textContent = String(message);

    const close = document.createElement('span');
    close.textContent = "\u00d7";
    close.style.cssText = "margin-left: 10px; cursor: pointer; font-weight: bold;";
    close.onclick = () => toast.remove();

    toast.appendChild(text);
    toast.appendChild(close);
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
