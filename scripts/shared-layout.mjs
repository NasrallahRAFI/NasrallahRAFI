const detailNavigation = [
    ['About', 'about'],
    ['Experience', 'experience'],
    ['Projects', 'projects'],
    ['Skills', 'skills'],
    ['Patents', 'patents'],
    ['Development', 'dev-focus']
];

export const pageFiles = [
    'index.html', 'index-fr.html',
    'apprenticeship-rafi.html', 'apprenticeship-rafi-fr.html',
    'internship-onee.html', 'internship-onee-fr.html',
    'internship-smcv.html', 'internship-smcv-fr.html',
    'pfe-gantt.html', 'pfe-gantt-fr.html',
    'project-rendezvous.html', 'project-rendezvous-fr.html',
    'project-smart-bms.html', 'project-smart-bms-fr.html',
    'project-thermal.html', 'project-thermal-fr.html',
    'project-waveguide.html', 'project-waveguide-fr.html'
];

export const sharedHeadAssets = `<link href="https://unpkg.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link href="css/tailwind.min.css" rel="stylesheet"/>
<script crossorigin="anonymous" defer integrity="sha384-vEpkK5oidsrH6UhRc6tAPlgJZ/qXFwumFY+Kx8vBSeZ7NBag809YZCSmxFYGe/pt" src="https://unpkg.com/lucide@1.20.0/dist/umd/lucide.min.js"></script>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&amp;family=JetBrains+Mono:wght@500;600&amp;display=swap" rel="stylesheet"/>
<link href="css/style.min.css?v=6" rel="stylesheet"/>
<script src="js/theme.js?v=6" defer></script>`;

export function isFrench(fileName) {
    return fileName.endsWith('-fr.html');
}

function navLinks({ french, mobile = false }) {
    const labels = french
        ? ['Profil', 'Parcours', 'Projets', 'Comp&eacute;tences', 'Brevet', 'D&eacute;veloppement']
        : detailNavigation.map(([label]) => label);
    const classes = mobile
        ? 'block py-2 px-3 theme-text-light hover:theme-bg-alt hover:text-accent rounded-lg transition-colors'
        : 'theme-text-light hover:text-accent font-medium transition-colors';
    const spacing = mobile ? '' : ' ';
    return detailNavigation.map(([, anchor], index) => `<a class="${classes}" href="index${french ? '-fr' : ''}.html#${anchor}">${labels[index]}</a>`).join(spacing);
}

export function detailHeader(fileName) {
    const french = isFrench(fileName);
    const englishFile = fileName.replace('-fr', '');
    const alternate = french ? englishFile : fileName.replace('.html', '-fr.html');
    const backAnchor = fileName.includes('project-') ? 'projects' : fileName.includes('pfe-') || fileName.includes('internship-') || fileName.includes('apprenticeship-') ? 'experience' : 'projects';
    const copy = french ? {
        aria: 'Voir la version anglaise', title: 'Version anglaise', current: 'FR', target: 'EN',
        theme: 'Th&egrave;me', back: 'Retour'
    } : {
        aria: 'Afficher la version fran&ccedil;aise', title: 'Version fran&ccedil;aise', current: 'EN', target: 'FR',
        theme: 'Theme', back: 'Back'
    };
    return `<header class="sticky top-0 z-50 glass transition-colors duration-300">
<div class="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center gap-4">
<a class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-cyan-200 hover:text-cyan-300 transition-colors truncate" href="index${french ? '-fr' : ''}.html#hero">Rafi Nasrallah</a>
<nav class="hidden lg:flex space-x-6">${navLinks({ french })}</nav>
<div class="flex items-center space-x-2 sm:space-x-4">
<button aria-label="${copy.theme}" class="theme-toggle-button theme-text-main transition-colors flex items-center justify-center" id="theme-toggle-button" type="button"><i class="w-4 h-4" data-lucide="palette" id="theme-toggle-icon"></i><span class="theme-toggle-copy">${copy.theme}</span><span class="theme-toggle-name" id="theme-toggle-name">Glass</span></button>
<a aria-label="${copy.aria}" class="language-toggle-button theme-text-main transition-colors flex items-center justify-center" href="${alternate}" hreflang="${french ? 'en' : 'fr'}" lang="${french ? 'en' : 'fr'}" title="${copy.title}"><i aria-hidden="true" class="language-toggle-icon" data-lucide="languages"></i><span class="language-toggle-current">${copy.current}</span><span aria-hidden="true" class="language-toggle-arrow">&rarr;</span><span class="language-toggle-target">${copy.target}</span></a>
<a class="inline-flex items-center theme-text-light hover:text-accent font-medium transition-colors text-sm" href="index${french ? '-fr' : ''}.html#${backAnchor}"><i class="w-4 h-4 mr-2" data-lucide="arrow-left"></i><span class="hidden sm:inline">${copy.back}</span></a>
</div>
</div>
</header>`;
}

export function sharedFooter(fileName) {
    const french = isFrench(fileName);
    return `<footer class="theme-bg-main theme-text-main py-8 mt-16 border-t theme-border-main/50">
<div class="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
<p class="text-sm theme-text-muted">&copy; 2026 <span>Rafi Nasrallah</span> | ${french ? 'Ing&eacute;nieur &eacute;lectrique - Syst&egrave;mes embarqu&eacute;s, IoT &amp; Smart BMS' : 'Electrical Engineer - Embedded Systems, IoT &amp; Smart BMS'}</p>
<div class="mt-4 flex justify-center space-x-6">
<a aria-label="Email" class="theme-text-muted hover:text-accent transition-colors" href="mailto:nasrollahrafi@gmail.com"><i class="w-6 h-6" data-lucide="mail"></i></a>
<a aria-label="LinkedIn" class="inline-flex items-center gap-2 theme-text-muted hover:text-accent transition-colors" href="https://www.linkedin.com/in/nasrallah-rafi-4834862a2" rel="noopener noreferrer" target="_blank"><svg aria-hidden="true" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.32 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.1 20.45H3.54V9H7.1v11.45Z"/></svg><span>LinkedIn</span></a>
</div>
</div>
</footer>`;
}
