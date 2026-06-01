/**
 * TypeScript checker — bypasses npm bug that appends '2' as a CLI argument.
 * Runs tsc directly via Node.js child_process without going through npm.
 */
import { spawn } from 'node:child_process';
import process from 'node:process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const tscPath = path.resolve(root, 'node_modules', 'typescript', 'bin', 'tsc');

const child = spawn('node', [tscPath, '--noEmit', '--skipLibCheck'], {
  cwd: root,
  stdio: 'inherit',
});

child.on('close', (code) => {
  process.exit(code || 0);
});
