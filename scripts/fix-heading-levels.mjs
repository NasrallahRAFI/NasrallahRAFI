import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

for (const fileName of ['index.html', 'index-fr.html']) {
    const filePath = path.join(root, fileName);
    let source = fs.readFileSync(filePath, 'utf8');
    const start = source.indexOf('id="key-projects"');
    const end = source.indexOf('id="skills-and-tools"');
    if (start === -1 || end === -1) throw new Error(`${fileName}: portfolio heading anchors not found`);
    const before = source.slice(0, start);
    const section = source.slice(start, end);
    const after = source.slice(end);
    const normalized = section.replace(/<h4\b/g, '<h3').replace(/<\/h4>/g, '</h3>');
    fs.writeFileSync(filePath, before + normalized + after);
}

for (const fileName of ['project-smart-bms.html', 'project-smart-bms-fr.html']) {
    const filePath = path.join(root, fileName);
    const source = fs.readFileSync(filePath, 'utf8');
    const marker = source.indexOf('id="smart-bms-algorithm"');
    const headingStart = source.indexOf('<h3', marker);
    const headingEnd = source.indexOf('</h3>', headingStart);
    if (marker === -1 || headingStart === -1 || headingEnd === -1) throw new Error(`${fileName}: engineering-scope heading not found`);
    const normalized = source.slice(0, headingStart) + source.slice(headingStart, headingStart + 3).replace('<h3', '<h2')
        + source.slice(headingStart + 3, headingEnd) + '</h2>' + source.slice(headingEnd + 5);
    fs.writeFileSync(filePath, normalized);
}

console.log('Heading hierarchy normalized for the portfolio and Smart BMS pages.');
