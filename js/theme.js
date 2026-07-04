const THEMES = ['theme-glass', 'theme-volt', 'theme-deepsea', 'theme-obsidian'];
const DEFAULT_THEME = 'theme-glass';
const THEME_META = {
    'theme-glass': { icon: 'sun', label: 'Glass' },
    'theme-volt': { icon: 'zap', label: 'Volt' },
    'theme-deepsea': { icon: 'droplets', label: 'Deep Sea' },
    'theme-obsidian': { icon: 'moon', label: 'Obsidian' },
};

// The theme class already lives on <html> by the time this file runs —
// it's applied synchronously by the blocking snippet in <head> (see
// theme-init snippet) specifically so the correct theme is in place
// before the browser ever paints. This file only has to sync the icon
// and wire up the toggle button; it should never be the thing deciding
// the theme on a fresh load, since by then it's already too late to
// avoid a flash of the wrong colors.
function currentTheme() {
    return THEMES.find(t => document.documentElement.classList.contains(t)) || DEFAULT_THEME;
}

function initTheme() {
    // Safety net only: if the head snippet didn't run for some reason
    // (script order mistake, or this file dropped onto a page that
    // doesn't have the snippet yet), apply the theme now so the page
    // is still correct — just without the flash-free guarantee.
    if (!THEMES.some(t => document.documentElement.classList.contains(t))) {
        const saved = localStorage.getItem('portfolio-theme');
        document.documentElement.classList.add(THEMES.includes(saved) ? saved : DEFAULT_THEME);
    }
    updateThemeIcon(currentTheme());
}

function toggleTheme() {
    const current = currentTheme();
    const nextIndex = (THEMES.indexOf(current) + 1) % THEMES.length;
    const nextTheme = THEMES[nextIndex];

    document.documentElement.classList.remove(...THEMES);
    document.documentElement.classList.add(nextTheme);

    localStorage.setItem('portfolio-theme', nextTheme);
    updateThemeIcon(nextTheme);

    // Broadcast the change so other independent scripts on the page
    // (e.g. the chat widget) can react live without polling or
    // reaching into localStorage themselves.
    document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: nextTheme } }));
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
