/**
 * Vitest runner — bypasses npm bug that appends '2' as a CLI argument on Windows.
 * Spawns vitest directly via npx without going through npm scripts.
 */
import { exec } from 'node:child_process';
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const coverage = process.argv.includes('--coverage');
const cmd = coverage ? 'npx vitest run --coverage' : 'npx vitest run';

const child = exec(cmd, {
  cwd: root,
  env: process.env,
});

child.stdout?.pipe(process.stdout);
child.stderr?.pipe(process.stderr);

child.on('close', (code) => {
  process.exit(code || 0);
});
