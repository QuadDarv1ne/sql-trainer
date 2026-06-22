import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import vm from 'vm';

const src = readFileSync(join(process.cwd(), 'src/lib/i18n.ts'), 'utf8');

// Extract the full translations object by finding the = { ... }; assignment
// We use a brace-counting approach starting from the `= {` after `translations`
const assignIdx = src.indexOf('export const translations');
const eqIdx = src.indexOf('= {', assignIdx);
let depth = 0;
let endIdx = eqIdx;
let started = false;
for (let i = eqIdx; i < src.length; i++) {
  if (src[i] === '{') {
    depth++;
    started = true;
  }
  if (src[i] === '}') depth--;
  if (started && depth === 0) {
    endIdx = i + 1;
    break;
  }
}

const objText = src.substring(eqIdx + 2, endIdx); // skip '= ', get '{...}'

// Remove TypeScript comments (// and /* */)
const cleaned = objText.replace(/\/\/[^\n]*/g, '').replace(/\/\*[\s\S]*?\*\//g, '');

// Evaluate safely
const translations = vm.runInNewContext('(' + cleaned + ')', {}, { timeout: 5000 });

const localesDir = join(process.cwd(), 'src/locales');
mkdirSync(localesDir, { recursive: true });

for (const [loc, data] of Object.entries(translations)) {
  const count = Object.keys(data).length;
  const jsonPath = join(localesDir, `${loc}.json`);
  writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`Written ${loc}.json (${count} keys)`);
}

console.log('Done!');
