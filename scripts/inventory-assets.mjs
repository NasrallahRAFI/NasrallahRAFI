import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assetRoot = path.join(root, 'assets');
const files = [];

function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) walk(absolute);
        else {
            const extension = path.extname(entry.name).toLowerCase();
            if (['.png', '.jpg', '.jpeg', '.jfif', '.webp', '.gif', '.pdf'].includes(extension)) {
                files.push({ path: path.relative(root, absolute).replaceAll('\\', '/'), extension, bytes: fs.statSync(absolute).size });
            }
        }
    }
}

walk(assetRoot);
files.sort((a, b) => b.bytes - a.bytes);
const summary = files.reduce((result, file) => {
    result[file.extension] ??= { count: 0, bytes: 0 };
    result[file.extension].count += 1;
    result[file.extension].bytes += file.bytes;
    return result;
}, {});

const output = { generatedAt: new Date().toISOString(), summary, files };
fs.writeFileSync(path.join(root, 'assets', 'asset-inventory.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(`Asset inventory written: ${files.length} files across ${Object.keys(summary).length} formats.`);
