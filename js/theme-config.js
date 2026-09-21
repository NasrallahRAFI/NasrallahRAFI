(function () {
    'use strict';

    window.NR_THEME_CONFIG = Object.freeze({
        names: Object.freeze(['theme-glass', 'theme-deepsea']),
        defaultTheme: 'theme-glass',
        metadata: Object.freeze({
            'theme-glass': Object.freeze({ icon: 'sun', label: 'Classic' }),
            'theme-deepsea': Object.freeze({ icon: 'moon', label: 'Deep Sea' })
        }),
        colors: Object.freeze({
            'theme-glass': '#925C08',
            'theme-deepsea': '#2dd4bf'
        })
    });
}());
