/**
 * ESLint runner — bypasses npm bug that appends '2' as a CLI argument on Windows.
 * Directly invokes ESLint's Node.js API to lint src/ and scripts/ directories.
 */
import { ESLint } from 'eslint';
import process from 'node:process';

const eslint = new ESLint({
  fix: process.argv.includes('--fix'),
  cwd: process.cwd(),
});

const results = await eslint.lintFiles(['src/**/*.{ts,tsx}', 'scripts/**/*.{mjs,js}']);
const formatter = await eslint.loadFormatter('stylish');
const output = formatter.format(results);

if (output) console.log(output);

const errorCount = results.reduce((sum, r) => sum + r.errorCount, 0);
const warningCount = results.reduce((sum, r) => sum + r.warningCount, 0);

console.log(`\n✖ ${errorCount + warningCount} problems (${errorCount} errors, ${warningCount} warnings)`);
process.exit(errorCount > 0 ? 1 : 0);
