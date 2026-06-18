import fs from 'fs';
const c = fs.readFileSync('src/lib/i18n.ts', 'utf-8');

// Extract the en block
const enMatch = c.match(/\s{2}en: \{\n([\s\S]*?)\n  \},  \/\/ en/);
const ruMatch = c.match(/\s{2}ru: \{\n([\s\S]*?)\n  \},  \/\/ ru/);

if (!enMatch || !ruMatch) {
  console.log('Could not find en/ru blocks');
  console.log('enMatch:', !!enMatch, 'ruMatch:', !!ruMatch);
  process.exit(1);
}

const enKeys = [...enMatch[1].matchAll(/  '([^']+)':/g)].map((m) => m[1]);
const ruKeys = [...ruMatch[1].matchAll(/  '([^']+)':/g)].map((m) => m[1]);

const ruOnly = ruKeys.filter((k) => !enKeys.includes(k));
console.log(`Keys in ru: ${ruKeys.length}, in en: ${enKeys.length}`);
console.log(`Keys in ru but missing in en: ${ruOnly.length}\n`);
console.log('Sample of ru-only keys:');
ruOnly.slice(0, 30).forEach((k) => console.log('  ' + k));
