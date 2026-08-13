import fs from 'node:fs';
import crypto from 'node:crypto';

const hashes = new Set();
for (const file of fs.readdirSync('.').filter(name => name.endsWith('.html'))) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)) {
        const digest = crypto.createHash('sha256').update(match[1]).digest('base64');
        hashes.add(`'sha256-${digest}'`);
    }
}
console.log([...hashes].join(' '));
console.error(`count=${hashes.size}`);
