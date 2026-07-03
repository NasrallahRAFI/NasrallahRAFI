const fs = require('fs');
const path = require('path');

const dir = process.cwd();
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const snippet = `\n<!-- Chatbot Dependencies -->\n<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"><\/script>\n<script src="https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.5/purify.min.js"><\/script>\n<script src="js/chatbot.js" defer><\/script>\n</body>`;

let count = 0;
for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');

    if (content.includes('js/chatbot.js')) {
        console.log(`SKIP (already injected): ${file}`);
        continue;
    }

    if (content.includes('</body>')) {
        content = content.replace(/<\/body>/i, snippet);
        fs.writeFileSync(filePath, content, 'utf8');
        count++;
        console.log(`Injected: ${file}`);
    } else {
        console.log(`SKIP (no </body>): ${file}`);
    }
}
console.log(`\nDone. Injected chatbot into ${count} HTML files.`);
