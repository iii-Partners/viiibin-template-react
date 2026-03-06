#!/usr/bin/env node
/**
 * App Icon & Splash Screen Generator
 *
 * Takes a source icon (1024x1024 PNG) and generates all required sizes
 * for iOS and Android platforms.
 *
 * Usage: node scripts/generate-icons.mjs <source-icon.png>
 *
 * Requires: sharp (npm install -D sharp)
 *
 * iOS icons generated:
 *   - 20x20, 29x29, 40x40, 60x60, 76x76, 83.5x83.5, 1024x1024
 *   - @2x and @3x variants
 *
 * Android icons generated:
 *   - mdpi (48x48), hdpi (72x72), xhdpi (96x96), xxhdpi (144x144), xxxhdpi (192x192)
 *   - Adaptive icon foreground (108dp padded)
 *   - Play Store icon (512x512)
 *
 * Splash screens generated:
 *   - 2732x2732 universal (iOS)
 *   - Various Android densities
 */
import { existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';

// Check for sharp
let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('Error: sharp is required. Run: npm install -D sharp');
  process.exit(1);
}

const SOURCE = process.argv[2];
if (!SOURCE || !existsSync(SOURCE)) {
  console.error('Usage: node scripts/generate-icons.mjs <source-icon-1024x1024.png>');
  process.exit(1);
}

const IOS_DIR = resolve('ios/App/App/Assets.xcassets/AppIcon.appiconset');
const ANDROID_RES = resolve('android/app/src/main/res');
const SPLASH_DIR = resolve('resources/splash');

// iOS icon sizes
const IOS_SIZES = [
  { size: 20, scales: [2, 3] },
  { size: 29, scales: [2, 3] },
  { size: 40, scales: [2, 3] },
  { size: 60, scales: [2, 3] },
  { size: 76, scales: [1, 2] },
  { size: 83.5, scales: [2] },
  { size: 1024, scales: [1] },
];

// Android densities
const ANDROID_DENSITIES = [
  { name: 'mipmap-mdpi', size: 48 },
  { name: 'mipmap-hdpi', size: 72 },
  { name: 'mipmap-xhdpi', size: 96 },
  { name: 'mipmap-xxhdpi', size: 144 },
  { name: 'mipmap-xxxhdpi', size: 192 },
];

async function generate() {
  const img = sharp(SOURCE);
  const meta = await img.metadata();
  console.log(`Source: ${meta.width}x${meta.height}`);

  if (meta.width < 1024 || meta.height < 1024) {
    console.warn('Warning: Source icon should be at least 1024x1024');
  }

  // iOS icons
  if (existsSync(resolve('ios'))) {
    mkdirSync(IOS_DIR, { recursive: true });
    for (const { size, scales } of IOS_SIZES) {
      for (const scale of scales) {
        const px = Math.round(size * scale);
        const name = `icon-${size}@${scale}x.png`;
        await sharp(SOURCE).resize(px, px).png().toFile(resolve(IOS_DIR, name));
        console.log(`  iOS: ${name} (${px}x${px})`);
      }
    }
    console.log('iOS icons generated');
  }

  // Android icons
  if (existsSync(resolve('android'))) {
    for (const { name: density, size } of ANDROID_DENSITIES) {
      const dir = resolve(ANDROID_RES, density);
      mkdirSync(dir, { recursive: true });
      await sharp(SOURCE).resize(size, size).png().toFile(resolve(dir, 'ic_launcher.png'));
      // Foreground for adaptive icons (with padding)
      const fgSize = Math.round(size * 1.5);
      await sharp(SOURCE)
        .resize(Math.round(size * 0.66), Math.round(size * 0.66))
        .extend({
          top: Math.round(size * 0.42),
          bottom: Math.round(size * 0.42),
          left: Math.round(size * 0.42),
          right: Math.round(size * 0.42),
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        })
        .resize(fgSize, fgSize)
        .png()
        .toFile(resolve(dir, 'ic_launcher_foreground.png'));
      console.log(`  Android: ${density} (${size}x${size})`);
    }
    // Play Store icon
    await sharp(SOURCE).resize(512, 512).png().toFile(resolve(ANDROID_RES, 'playstore-icon.png'));
    console.log('Android icons generated');
  }

  // Splash screens
  mkdirSync(SPLASH_DIR, { recursive: true });
  // Universal splash (centered logo on background)
  const splashSizes = [
    { name: 'splash-2732x2732.png', w: 2732, h: 2732 },
    { name: 'splash-1284x2778.png', w: 1284, h: 2778 },
    { name: 'splash-1080x1920.png', w: 1080, h: 1920 },
  ];
  for (const { name, w, h } of splashSizes) {
    const logoSize = Math.round(Math.min(w, h) * 0.3);
    await sharp(SOURCE)
      .resize(logoSize, logoSize)
      .extend({
        top: Math.round((h - logoSize) / 2),
        bottom: Math.round((h - logoSize) / 2),
        left: Math.round((w - logoSize) / 2),
        right: Math.round((w - logoSize) / 2),
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .resize(w, h)
      .png()
      .toFile(resolve(SPLASH_DIR, name));
    console.log(`  Splash: ${name}`);
  }
  console.log('Splash screens generated');
  console.log('\nDone! Review generated assets and update capacitor.config.ts if needed.');
}

generate().catch(console.error);
