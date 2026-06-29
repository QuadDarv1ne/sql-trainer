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
    const line = lines[i];
    // Line starts with single quote (inside a task object) and contains an unescaped mid-string single quote
    const trimmed = line.trim();
    if (trimmed.startsWith("'") && !trimmed.startsWith("'use ") && !trimmed.includes("\\'")) {
      // Count single quotes - if odd, there's an unescaped one
      const quoteCount = (trimmed.match(/'/g) || []).length;
      if (quoteCount > 2 && quoteCount % 2 !== 0) {
        console.log(f + ':' + (i + 1) + ': ' + trimmed.substring(0, 120));
      }
    }
  }
}
console.log('Done');
