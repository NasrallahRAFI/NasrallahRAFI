const THEMES = ['theme-glass', 'theme-volt', 'theme-deepsea', 'theme-obsidian'];
const DEFAULT_THEME = 'theme-glass';
const THEME_META = {
    'theme-glass': { icon: 'sun', label: 'Glass' },
    'theme-volt': { icon: 'zap', label: 'Volt' },
    'theme-deepsea': { icon: 'droplets', label: 'Deep Sea' },
    'theme-obsidian': { icon: 'moon', label: 'Obsidian' },
};

// FIX: mobile browser chrome (Android Chrome address bar, iOS Safari
// status bar) reads <meta name="theme-color">. It was hardcoded to the
// Glass color on the 2 pages that had it, and missing entirely from the
// other 17 — so it never matched a visitor's actual saved theme. Colors
// mirror --accent-color per theme in css/style.css.
const THEME_COLOR = {
    'theme-glass': '#06b6d4',
    'theme-volt': '#fbbf24',
    'theme-deepsea': '#2dd4bf',
    'theme-obsidian': '#f8fafc',
};

function updateMetaThemeColor(theme) {
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'theme-color');
        document.head.appendChild(meta);
    }
    meta.setAttribute('content', THEME_COLOR[theme] || THEME_COLOR[DEFAULT_THEME]);
}

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
    updateMetaThemeColor(currentTheme()); // FIX: sync on initial load too
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

// FIX: this is the listener that never existed. The event was already
// being dispatched above on every toggle — nothing consumed it. This
// is what actually revives it, decoupled from toggleTheme() itself so
// any other future script can hook the same event without touching
// this function.
document.addEventListener('themechange', function (e) {
    updateMetaThemeColor(e.detail.theme);
});

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
