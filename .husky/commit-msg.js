/**
 * Commit message validator hook
 * Validates commit messages follow Conventional Commits format
 */

/* eslint-disable no-console -- husky hook needs console for user feedback */
import { readFileSync, execSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read the commit message from the file passed as argument
const commitMsgFile = process.argv[2];
const commitMessage = readFileSync(commitMsgFile, 'utf-8').trim();

// Skip merge commits
if (commitMessage.startsWith('Merge ')) {
  process.exit(0);
}

console.log(`\n📝 Validating commit: ${commitMessage.slice(0, 50)}...\n`);

try {
  const configPath = join(__dirname, '../../commitlint.config.js');
  execSync(`npx @commitlint/cli --config ${configPath} --edit ${commitMsgFile}`, {
    stdio: 'inherit',
  });
  console.log('\n✅ Commit message is valid!\n');
} catch (_error) {
  console.error('\n❌ Commit message validation failed!');
  console.error('\n📖 Conventional Commits format:');
  console.error('   <type>(<scope>): <subject>\n');
  console.error('   Examples:');
  console.error('   feat: add new authentication flow');
  console.error('   fix: resolve database connection timeout');
  console.error('   docs: update API documentation');
  console.error('   refactor: simplify user validation logic');
  console.error('\n   Allowed types: feat, fix, docs, chore, refactor, perf, test, build, ci, revert, style\n');
  process.exit(1);
}
