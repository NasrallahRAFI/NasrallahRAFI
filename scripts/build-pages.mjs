import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { detailHeader, pageFiles, sharedFooter, sharedHeadAssets } from './shared-layout.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let changed = 0;

for (const fileName of pageFiles) {
    const filePath = path.join(root, fileName);
    let source = fs.readFileSync(filePath, 'utf8');

    source = source.replace(/<script>\s*\(function \(\) \{\s*var THEMES = \[[\s\S]*?<\/script>/i, '<script src="js/theme-config.js"></script>\n<script src="js/theme-init.js"></script>');

    if (source.includes('css/style.min.css')) {
        source = source
            .replace(/<link\b[^>]*href=["'][^"']*tailwind\.min\.css[^"']*["'][^>]*>\s*/gi, '')
            .replace(/<script\b[^>]*src=["'][^"']*lucide\.min\.js[^"']*["'][^>]*><\/script>\s*/gi, '')
            .replace(/<link\b[^>]*href=["']https:\/\/fonts\.googleapis\.com[^"']*["'][^>]*>\s*/gi, '')
            .replace(/<link\b[^>]*href=["']https:\/\/fonts\.gstatic\.com[^"']*["'][^>]*>\s*/gi, '')
            .replace(/<link\b[^>]*href=["'][^"']*style\.min\.css[^"']*["'][^>]*>\s*/gi, '')
            .replace(/<script\b[^>]*src=["'][^"']*js\/theme\.js[^"']*["'][^>]*><\/script>\s*/gi, '')
            .replace(/<script\b[^>]*src=["']js\/(?:site-shell|home-shell)\.js[^"']*["'][^>]*><\/script>\s*/gi, '')
            .replace(/<link\b[^>]*href=["']https:\/\/unpkg\.com["'][^>]*>\s*/gi, '')
            .replace(/<link\b[^>]*href=["']https:\/\/fonts\.googleapis\.com["'][^>]*>\s*/gi, '')
            .replace(/<link\b[^>]*href=["']https:\/\/fonts\.gstatic\.com["'][^>]*>\s*/gi, '')
            .replace('</head>', `${sharedHeadAssets}\n<script src="js/site-shell.js" defer></script>${fileName.startsWith('index') ? '\n<script src="js/home-shell.js" defer></script>' : ''}\n</head>`);
    }

    // Keep structured data inline, but move executable page chrome and MathJax
    // configuration behind external scripts so enforcing CSP needs no unsafe-inline.
    source = source.replace(/<script(?![^>]*src=)[^>]*>\s*(?:window\.)?MathJax\s*=\s*[\s\S]*?<\/script>\s*/i, '<script src="js/mathjax-config.js" defer></script>\n');
    source = source.replace(/<script(?![^>]*src=)[^>]*>\s*(?:\/\/[^\n]*\n\s*)?document\.addEventListener\(['"]DOMContentLoaded['"],\s*\(\)\s*=>\s*\{\s*if\s*\(window\.lucide\)\s*window\.lucide\.createIcons\(\);\s*\}\);\s*<\/script>\s*/i, '');
    source = source.replace(/<script(?![^>]*src=)[^>]*>\s*lucide\.createIcons\(\);\s*<\/script>\s*/i, '');
    if (fileName.startsWith('index')) {
        source = source.replace(/<script(?![^>]*src=)[^>]*>\s*\/\/ Initialize Lucide icons[\s\S]*?<\/script>\s*/i, '');
    }
    source = source.replace(/onclick="toggleTheme\(\)"\s*/gi, '');
    if (fileName.startsWith('pfe-gantt')) {
        source = source.replace(/onclick="triggerPrint\(\)"/i, 'id="print-button"');
        source = source.replace(/document\.getElementById\('print-button'\)\?\.addEventListener\('click', triggerPrint\);\s*/g, '');
        source = source.replace(/function triggerPrint\(\)\s*\{/, "document.getElementById('print-button')?.addEventListener('click', triggerPrint);\n\nfunction triggerPrint() {");
    }

    if (!fileName.startsWith('index')) {
        const headerPattern = /<header\b[^>]*>[\s\S]*?<\/header>/i;
        if (headerPattern.test(source)) source = source.replace(headerPattern, detailHeader(fileName));
    }

    if (/<footer\b[\s\S]*?<\/footer>/i.test(source)) {
        source = source.replace(/<footer\b[\s\S]*?<\/footer>/i, sharedFooter(fileName));
    }

    if (source !== fs.readFileSync(filePath, 'utf8')) {
        fs.writeFileSync(filePath, source);
        changed += 1;
    }
}

console.log(`Shared page build completed: ${pageFiles.length} pages checked, ${changed} regenerated.`);
