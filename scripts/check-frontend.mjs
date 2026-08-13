import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlFiles = fs.readdirSync(root).filter((name) => name.endsWith('.html'));
const jsFiles = [];

function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (['node_modules', '.git', '.codex', '.claude', '.impeccable'].includes(entry.name)) continue;
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) walk(absolute);
        else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) jsFiles.push(absolute);
    }
}

walk(root);

const failures = [];
const warnings = [];
const externalScriptSources = new Set();
const inlineScriptFiles = new Set();
const inlineHandlerFiles = new Set();
const allowedExternalScripts = new Map([
    ['https://unpkg.com/lucide@1.20.0/dist/umd/lucide.min.js', 'sha384-vEpkK5oidsrH6UhRc6tAPlgJZ/qXFwumFY+Kx8vBSeZ7NBag809YZCSmxFYGe/pt'],
    ['https://cdn.jsdelivr.net/npm/mathjax@3.2.2/es5/tex-svg.js', 'sha384-KKWa9jJ1MZvssLeOoXG6FiOAZfAgmzsIIfw8BXwI9+kYm0lPCbC6yTQPBC00F1/L']
]);

function reportFailure(message) {
    failures.push(message);
}

function reportWarning(message) {
    warnings.push(message);
}

function checkLocalReference(fileName, value) {
    if (!value || value.startsWith('#') || value.startsWith('mailto:') || value.startsWith('tel:')
        || value.startsWith('javascript:') || value.startsWith('data:') || /^https?:\/\//i.test(value)
        || value.startsWith('//')) return;

    const cleanValue = value.split(/[?#]/, 1)[0];
    let decoded;
    try {
        decoded = decodeURIComponent(cleanValue);
    } catch {
        decoded = cleanValue;
    }
    const target = path.resolve(root, decoded.replace(/^\//, ''));
    if (!target.startsWith(root + path.sep) && target !== root) {
        reportFailure(`${fileName}: reference escapes the frontend root: ${value}`);
    } else if (!fs.existsSync(target)) {
        reportFailure(`${fileName}: missing local reference: ${value}`);
    }
}

for (const fileName of htmlFiles) {
    const source = fs.readFileSync(path.join(root, fileName), 'utf8');
    const scripts = [...source.matchAll(/<script\b[^>]*>/gi)];
    const chatbotCount = (source.match(/<script\b[^>]*src=["']js\/chatbot\.js(?:\?[^"']*)?["'][^>]*>/gi) || []).length;
    if (chatbotCount !== 1) reportFailure(`${fileName}: expected exactly one chatbot.js script, found ${chatbotCount}`);

    const language = source.match(/<html\b[^>]*\blang=["']([^"']+)["']/i)?.[1];
    if (!language) reportFailure(`${fileName}: missing html lang attribute`);
    if (!(source.match(/<meta\b[^>]*name=["']viewport["']/i))) reportFailure(`${fileName}: missing viewport meta`);
    if (!(source.match(/<title\b[^>]*>\s*[^<]+/i))) reportFailure(`${fileName}: missing or empty title`);

    for (const match of source.matchAll(/\b(?:src|href)=(['"])(.*?)\1/gi)) checkLocalReference(fileName, match[2]);

    if (/<script\b(?![^>]*\bsrc=)[^>]*>/i.test(source)) inlineScriptFiles.add(fileName);
    if (/\bon[a-z]+\s*=\s*["']/i.test(source)) inlineHandlerFiles.add(fileName);

    const imageTags = [...source.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
    imageTags.forEach((tag, index) => {
        if (!/\balt=["']/i.test(tag)) reportFailure(`${fileName}: image ${index + 1} is missing alt text`);
        if (!/\b(?:width|height)=["']/i.test(tag)) reportWarning(`${fileName}: image ${index + 1} has no explicit dimensions`);
    });

    for (const script of scripts) {
        const sourceMatch = script[0].match(/\bsrc=["']([^"']+)["']/i);
        if (!sourceMatch) continue;
        const sourceUrl = sourceMatch[1];
        if (!/^https?:\/\//i.test(sourceUrl)) continue;
        externalScriptSources.add(sourceUrl);
        const expectedIntegrity = allowedExternalScripts.get(sourceUrl);
        if (!expectedIntegrity) reportFailure(`${fileName}: unapproved external script: ${sourceUrl}`);
        else if (script[0].match(/\bintegrity=["']([^"']+)["']/i)?.[1] !== expectedIntegrity) {
            reportFailure(`${fileName}: incorrect or missing SRI for ${sourceUrl}`);
        }
        if (!/\bcrossorigin=["'][^"']*["']/i.test(script[0])) reportFailure(`${fileName}: missing crossorigin on ${sourceUrl}`);
    }
}

const headersPath = path.join(root, '_headers');
const headers = fs.existsSync(headersPath) ? fs.readFileSync(headersPath, 'utf8') : '';
if (!headers.includes('Content-Security-Policy-Report-Only:')) {
    reportFailure('_headers: missing Content-Security-Policy-Report-Only header');
}

if (gitTrackedEnvFile()) {
    reportFailure('.env: secret environment file is tracked');
}

for (const file of jsFiles) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) reportFailure(`${path.relative(root, file)}: JavaScript syntax check failed`);
}

const cssSource = path.join(root, 'css', 'style.css');
const cssMinified = path.join(root, 'css', 'style.min.css');
if (fs.existsSync(cssSource) && fs.existsSync(cssMinified)) {
    const expectedCss = fs.readFileSync(cssSource, 'utf8')
        .replace(/\/\*.*?\*\//gs, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([{};:,])\s*/g, '$1');
    const actualCss = fs.readFileSync(cssMinified, 'utf8').trim();
    if (expectedCss.trim() !== actualCss) reportFailure('css/style.min.css: does not match the deterministic minification of css/style.css');
}

function gitTrackedEnvFile() {
    const result = spawnSync('git', ['ls-files', '--error-unmatch', '.env'], { cwd: root, encoding: 'utf8' });
    return result.status === 0;
}

if (failures.length) {
    console.error('Frontend checks failed:');
    failures.forEach((failure) => console.error(`- ${failure}`));
} else {
    console.log(`Frontend checks passed for ${htmlFiles.length} HTML pages and ${jsFiles.length} JavaScript files.`);
}

if (warnings.length) {
    console.warn(`Warnings: ${warnings.length}`);
    warnings.slice(0, 20).forEach((warning) => console.warn(`- ${warning}`));
    if (warnings.length > 20) console.warn(`- ...and ${warnings.length - 20} more`);
}

console.log(`External scripts verified: ${externalScriptSources.size}`);
console.log(`CSP inventory: ${inlineScriptFiles.size} files with inline scripts, ${inlineHandlerFiles.size} files with inline handlers.`);
if (inlineScriptFiles.size) console.warn(`Inline scripts remain in: ${[...inlineScriptFiles].join(', ')}`);
if (inlineHandlerFiles.size) console.warn(`Inline handlers remain in: ${[...inlineHandlerFiles].join(', ')}`);
process.exitCode = failures.length ? 1 : 0;
