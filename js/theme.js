// theme.js
function initTheme() {
    const savedTheme = localStorage.getItem('portfolio-theme') || 'theme-glass';
    document.body.classList.add(savedTheme);
}

function toggleTheme() {
    const isDashboard = document.body.classList.contains('theme-dashboard');
    const newTheme = isDashboard ? 'theme-glass' : 'theme-dashboard';
    
    document.body.classList.remove('theme-glass', 'theme-dashboard');
    document.body.classList.add(newTheme);
    
    localStorage.setItem('portfolio-theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const iconEl = document.getElementById('theme-toggle-icon');
    if (iconEl && window.lucide) {
        if (theme === 'theme-dashboard') {
            iconEl.setAttribute('data-lucide', 'layout-dashboard');
        } else {
            iconEl.setAttribute('data-lucide', 'layers');
        }
        // Re-render the specific icon or all icons
        lucide.createIcons();
    }
}

// Run immediately to set the class on the body before content renders
initTheme();

// Ensure the icon is correct when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const currentTheme = document.body.classList.contains('theme-dashboard') ? 'theme-dashboard' : 'theme-glass';
    updateThemeIcon(currentTheme);
});
