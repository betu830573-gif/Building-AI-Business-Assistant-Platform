// ─── Shared Utilities ────────────────────────────────────────────────────────

// Mark active nav link
function setActiveNav() {
    const path = window.location.pathname;
    document.querySelectorAll('.nav-links a').forEach(link => {
        const href = link.getAttribute('href');
        if (href === path || (path === '/' && href === '/') || (path.includes(href) && href !== '/')) {
            link.classList.add('active');
        }
    });
}

// Toast notifications
function showToast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icons[type] || 'ℹ️'}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'toastIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// Simple markdown to HTML renderer
function renderMarkdown(text) {
    if (!text) return '';
    return text
        .replace(/### (.*?)(\n|$)/g, '<h3>$1</h3>')
        .replace(/## (.*?)(\n|$)/g, '<h2>$1</h2>')
        .replace(/# (.*?)(\n|$)/g, '<h1>$1</h1>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>')
        .replace(/^- (.*?)(\n|$)/gm, '<li>$1</li>')
        .replace(/^(\d+)\. (.*?)(\n|$)/gm, '<li>$2</li>')
        .replace(/---/g, '<hr>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^<p>/, '')
        .replace(/<\/p>$/, '');
}

// Format currency
function formatCurrency(value) {
    const num = parseFloat(value) || 0;
    if (num >= 1000000) return '$' + (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return '$' + (num / 1000).toFixed(1) + 'K';
    return '$' + num.toFixed(2);
}

// Format number
function formatNumber(value) {
    return (parseFloat(value) || 0).toLocaleString();
}

document.addEventListener('DOMContentLoaded', setActiveNav);
