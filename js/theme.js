const THEMES = ['theme-glass', 'theme-volt', 'theme-deepsea', 'theme-obsidian'];
const DEFAULT_THEME = 'theme-glass';
const THEME_META = {
    'theme-glass': { icon: 'sun', label: 'Glass' },
    'theme-volt': { icon: 'zap', label: 'Volt' },
    'theme-deepsea': { icon: 'droplets', label: 'Deep Sea' },
    'theme-obsidian': { icon: 'moon', label: 'Obsidian' },
};

function initTheme() {
    const savedTheme = localStorage.getItem('portfolio-theme');
    const theme = THEMES.includes(savedTheme) ? savedTheme : DEFAULT_THEME;

    document.body.classList.remove(...THEMES);
    document.body.classList.add(theme);
    updateThemeIcon(theme);
}

function toggleTheme() {
    const currentTheme = THEMES.find(t => document.body.classList.contains(t)) || DEFAULT_THEME;
    const nextIndex = (THEMES.indexOf(currentTheme) + 1) % THEMES.length;
    const nextTheme = THEMES[nextIndex];
    
    document.body.classList.remove(...THEMES);
    document.body.classList.add(nextTheme);
    
    localStorage.setItem('portfolio-theme', nextTheme);
    updateThemeIcon(nextTheme);
}

function updateThemeIcon(theme) {
    const iconEl = document.getElementById('theme-toggle-icon');
    const labelEl = document.getElementById('theme-toggle-name');
    const buttonEl = document.getElementById('theme-toggle-button');
    const themeMeta = THEME_META[theme] || THEME_META[DEFAULT_THEME];

    if (labelEl) {
        labelEl.textContent = themeMeta.label;
    }

    if (buttonEl) {
        buttonEl.setAttribute('aria-label', `Change theme. Current theme: ${themeMeta.label}`);
        buttonEl.setAttribute('title', `Change theme. Current: ${themeMeta.label}`);
    }

    if (iconEl && window.lucide) {
        iconEl.setAttribute('data-lucide', themeMeta.icon);
        lucide.createIcons();
    }
}


document.addEventListener('DOMContentLoaded', () => {
    initTheme();
});
