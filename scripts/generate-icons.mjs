/**
 * Generate PNG icons from SVG for PWA.
 * Uses canvas if available, otherwise creates simple placeholder PNGs.
 * Run with: node scripts/generate-icons.mjs
 */

import { createCanvas } from 'canvas';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public', 'icons');

const SIZES = [192, 512];

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#09090b';
  ctx.beginPath();
  const radius = size * 0.225;
  ctx.roundRect(0, 0, size, size, radius);
  ctx.fill();

  // Green square
  const squareSize = size * 0.53;
  const squareOffset = (size - squareSize) / 2;
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.roundRect(squareOffset, squareOffset, squareSize, squareSize, radius * 0.37);
  ctx.fill();

  // Database icon
  ctx.fillStyle = 'white';
  const centerX = size / 2;
  const centerY = size / 2;
  const dbWidth = size * 0.35;
  const dbHeight = size * 0.45;

  // Top ellipse
  ctx.beginPath();
  ctx.ellipse(centerX, centerY - dbHeight / 2, dbWidth / 2, dbHeight / 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Middle ellipse
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, dbWidth / 2, dbHeight / 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bottom ellipse
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY + dbHeight / 2, dbWidth / 2, dbHeight / 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sides
  ctx.globalAlpha = 0.9;
  ctx.fillRect(centerX - dbWidth / 2, centerY - dbHeight / 2, dbWidth, dbHeight);

  // Redraw ellipses on top
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY - dbHeight / 2, dbWidth / 2, dbHeight / 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY, dbWidth / 2, dbHeight / 6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY + dbHeight / 2, dbWidth / 2, dbHeight / 6, 0, 0, Math.PI * 2);
  ctx.fill();

  const buffer = canvas.toBuffer('image/png');
  writeFileSync(join(PUBLIC_DIR, `icon-${size}.png`), buffer);
  console.log(`Generated icon-${size}.png`);
}

try {
  mkdirSync(PUBLIC_DIR, { recursive: true });
  for (const size of SIZES) {
    generateIcon(size);
  }
  console.log('All icons generated successfully!');
} catch (error) {
  console.error('Error generating icons:', error.message);
  console.log('Falling back to SVG-only mode. Update manifest.json to use SVG icons.');
}
