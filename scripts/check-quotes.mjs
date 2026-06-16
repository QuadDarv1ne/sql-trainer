import fs from 'fs';
const files = [
  'src/lib/tasks/advanced.ts',
  'src/lib/tasks/intermediate.ts',
  'src/lib/tasks/mongodb.ts',
  'src/lib/tasks/mysql.ts',
  'src/lib/tasks/beginner.ts',
];
for (const f of files) {
  const c = fs.readFileSync(f, 'utf-8');
  const lines = c.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    // Double-quoted string starting with " and containing unescaped inner double quotes
    if (trimmed.startsWith('"') && !trimmed.includes('\\"')) {
      const q = (trimmed.match(/"/g) || []).length;
      if (q > 2 && q % 2 !== 0) {
        console.log(f + ':' + (i + 1) + ': ' + trimmed.substring(0, 120));
      }
    }
  }
}
console.log('done');
