/**
 * Generate PWA assets:
 * - PNG icons from SVGs
 * - Placeholder screenshots for desktop and mobile
 */
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const ICONS_DIR = path.join(PUBLIC_DIR, 'icons');
const SCREENSHOTS_DIR = path.join(PUBLIC_DIR, 'screenshots');

async function generatePngIcons() {
  console.log('Generating PNG icons...');

  const icons = [
    { input: 'icon-192.svg', output: 'icon-192.png', size: 192 },
    { input: 'icon-512.svg', output: 'icon-512.png', size: 512 },
  ];

  for (const { input, output, size } of icons) {
    const inputPath = path.join(ICONS_DIR, input);
    const outputPath = path.join(ICONS_DIR, output);

    if (!fs.existsSync(inputPath)) {
      console.warn(`  Skipping ${input} — file not found`);
      continue;
    }

    await sharp(inputPath).resize(size, size).png().toFile(outputPath);

    console.log(`  ✓ ${output} (${size}x${size})`);
  }
}

async function generateScreenshots() {
  console.log('Generating placeholder screenshots...');

  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  // Desktop screenshot: 1280x720 with dark theme colors
  const desktopSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#09090b"/>
          <stop offset="100%" stop-color="#18181b"/>
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#bg)"/>
      <rect x="0" y="0" width="1280" height="48" fill="#18181b"/>
      <circle cx="24" cy="24" r="12" fill="#10b981"/>
      <text x="48" y="30" fill="#e4e4e7" font-family="system-ui" font-size="16" font-weight="600">SQL Тренажёр</text>
      <rect x="20" y="68" width="240" height="632" rx="8" fill="#18181b" stroke="#27272a" stroke-width="1"/>
      <rect x="40" y="90" width="200" height="32" rx="4" fill="#10b981" opacity="0.2"/>
      <text x="50" y="112" fill="#10b981" font-family="system-ui" font-size="14">SELECT * FROM users</text>
      <rect x="40" y="140" width="200" height="24" rx="4" fill="#27272a"/>
      <rect x="40" y="180" width="200" height="24" rx="4" fill="#27272a"/>
      <rect x="40" y="220" width="200" height="24" rx="4" fill="#27272a"/>
      <rect x="280" y="68" width="980" height="300" rx="8" fill="#18181b" stroke="#27272a" stroke-width="1"/>
      <text x="300" y="96" fill="#a1a1aa" font-family="monospace" font-size="14">SELECT * FROM users WHERE age > 18;</text>
      <rect x="280" y="388" width="980" height="312" rx="8" fill="#18181b" stroke="#27272a" stroke-width="1"/>
      <text x="300" y="420" fill="#e4e4e7" font-family="system-ui" font-size="14" font-weight="600">Результат: 3 строки</text>
      <rect x="300" y="440" width="940" height="1" fill="#27272a"/>
      <text x="300" y="470" fill="#10b981" font-family="monospace" font-size="12">id | name    | age | email</text>
      <text x="300" y="495" fill="#e4e4e7" font-family="monospace" font-size="12">1  | Alice   | 25  | alice@example.com</text>
      <text x="300" y="520" fill="#e4e4e7" font-family="monospace" font-size="12">2  | Bob     | 30  | bob@example.com</text>
      <text x="300" y="545" fill="#e4e4e7" font-family="monospace" font-size="12">3  | Charlie | 22  | charlie@example.com</text>
    </svg>
  `;

  const desktopPath = path.join(SCREENSHOTS_DIR, 'desktop.png');
  await sharp(Buffer.from(desktopSvg)).resize(1280, 720).png().toFile(desktopPath);
  console.log('  ✓ desktop.png (1280x720)');

  // Mobile screenshot: 750x1334
  const mobileSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="750" height="1334">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#09090b"/>
          <stop offset="100%" stop-color="#18181b"/>
        </linearGradient>
      </defs>
      <rect width="750" height="1334" fill="url(#bg)"/>
      <rect x="0" y="0" width="750" height="48" fill="#18181b"/>
      <circle cx="24" cy="24" r="12" fill="#10b981"/>
      <text x="48" y="30" fill="#e4e4e7" font-family="system-ui" font-size="16" font-weight="600">SQL Тренажёр</text>
      <rect x="20" y="68" width="710" height="400" rx="8" fill="#18181b" stroke="#27272a" stroke-width="1"/>
      <text x="40" y="100" fill="#a1a1aa" font-family="monospace" font-size="16">SELECT * FROM users;</text>
      <rect x="20" y="488" width="710" height="826" rx="8" fill="#18181b" stroke="#27272a" stroke-width="1"/>
      <text x="40" y="520" fill="#e4e4e7" font-family="system-ui" font-size="16" font-weight="600">Результат: 3 строки</text>
      <rect x="40" y="540" width="670" height="1" fill="#27272a"/>
      <text x="40" y="580" fill="#10b981" font-family="monospace" font-size="14">id | name    | age</text>
      <text x="40" y="620" fill="#e4e4e7" font-family="monospace" font-size="14">1  | Alice   | 25</text>
      <text x="40" y="660" fill="#e4e4e7" font-family="monospace" font-size="14">2  | Bob     | 30</text>
      <text x="40" y="700" fill="#e4e4e7" font-family="monospace" font-size="14">3  | Charlie | 22</text>
    </svg>
  `;

  const mobilePath = path.join(SCREENSHOTS_DIR, 'mobile.png');
  await sharp(Buffer.from(mobileSvg)).resize(750, 1334).png().toFile(mobilePath);
  console.log('  ✓ mobile.png (750x1334)');
}

async function main() {
  try {
    await generatePngIcons();
    await generateScreenshots();
    console.log('\nAll PWA assets generated successfully!');
  } catch (err) {
    console.error('Error generating assets:', err.message);
    process.exit(1);
  }
}

main();
