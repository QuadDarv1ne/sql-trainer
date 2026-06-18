import fs from 'fs';
const c = fs.readFileSync('src/lib/i18n.ts', 'utf-8');

const enMatch = c.match(/en: \{([^}]+)\},  \/\/ en/);
const ruMatch = c.match(/ru: \{([^}]+)\},  \/\/ ru/);
if (!enMatch || !ruMatch) {
  console.log('Could not find en/ru blocks');
  process.exit(1);
}

const enKeys = [...enMatch[1].matchAll(/  '([^']+)':/g)].map((m) => m[1]);
const ruKeys = [...ruMatch[1].matchAll(/  '([^']+)':/g)].map((m) => m[1]);

const ruOnly = ruKeys.filter((k) => !enKeys.includes(k));
console.log('Keys in ru but missing in en: ' + ruOnly.length);
ruOnly.slice(0, 30).forEach((k) => console.log('  ' + k));
