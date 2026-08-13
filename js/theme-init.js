(function () {
    'use strict';

    var config = window.NR_THEME_CONFIG;
    if (!config) return;
    var saved = localStorage.getItem('portfolio-theme');
    var theme = config.names.indexOf(saved) !== -1 ? saved : config.defaultTheme;
    document.documentElement.classList.add(theme);
}());
