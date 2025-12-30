#!/usr/bin/env node

/**
 * Script to copy Android icons from assets/android to android/app/src/main/res/
 * This ensures the latest icons are used when building the APK
 */

const fs = require('fs');
const path = require('path');

const ASSETS_ANDROID_DIR = path.join(__dirname, '..', 'assets', 'android');
const ANDROID_RES_DIR = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

// Directories to copy
const DIRECTORIES_TO_COPY = [
  'drawable',
  'mipmap-anydpi-v26',
  'mipmap-hdpi',
  'mipmap-mdpi',
  'mipmap-xhdpi',
  'mipmap-xxhdpi',
  'mipmap-xxxhdpi',
];

function copyFile(src, dest) {
  try {
    const destDir = path.dirname(dest);
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    // Remove existing file if it exists (to overwrite Expo-generated icons)
    if (fs.existsSync(dest)) {
      fs.unlinkSync(dest);
    }
    // Copy the file (this will overwrite any existing file)
    fs.copyFileSync(src, dest);
    console.log(`✓ Copied: ${path.relative(ASSETS_ANDROID_DIR, src)} → ${path.relative(ANDROID_RES_DIR, dest)}`);
  } catch (error) {
    console.error(`✗ Error copying ${src}:`, error.message);
    throw error;
  }
}

function copyDirectory(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) {
    console.warn(`⚠ Warning: Source directory does not exist: ${srcDir}`);
    return;
  }

  // Ensure destination directory exists
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  const files = fs.readdirSync(srcDir);

  files.forEach((file) => {
    const srcPath = path.join(srcDir, file);
    const destPath = path.join(destDir, file);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  });
}

function removeExistingIcons(dir) {
  if (!fs.existsSync(dir)) {
    return;
  }

  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      removeExistingIcons(filePath);
    } else {
      // Remove .webp and .png icon files that might conflict
      if (file.match(/^ic_launcher.*\.(webp|png)$/)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`  Removed existing: ${path.relative(ANDROID_RES_DIR, filePath)}`);
        } catch (error) {
          // Ignore errors if file doesn't exist
        }
      }
    }
  });
}

function main() {
  console.log('📱 Copying Android icons from assets/android to android/app/src/main/res/...\n');
  console.log('   This will overwrite any Expo-generated icons from app.json\n');

  if (!fs.existsSync(ASSETS_ANDROID_DIR)) {
    console.error(`✗ Error: Assets directory not found: ${ASSETS_ANDROID_DIR}`);
    process.exit(1);
  }

  // Create res directory if it doesn't exist (in case prebuild hasn't run)
  if (!fs.existsSync(ANDROID_RES_DIR)) {
    console.warn(`⚠ Warning: Android res directory not found: ${ANDROID_RES_DIR}`);
    console.warn(`   Creating directory structure...`);
    fs.mkdirSync(ANDROID_RES_DIR, { recursive: true });
  }

  // Remove existing icon files (including .webp) to avoid duplicates
  console.log('🧹 Cleaning up existing icon files...');
  DIRECTORIES_TO_COPY.forEach((dir) => {
    const destPath = path.join(ANDROID_RES_DIR, dir);
    if (fs.existsSync(destPath)) {
      removeExistingIcons(destPath);
    }
  });
  console.log('');

  let copiedCount = 0;
  let errorCount = 0;

  DIRECTORIES_TO_COPY.forEach((dir) => {
    const srcPath = path.join(ASSETS_ANDROID_DIR, dir);
    const destPath = path.join(ANDROID_RES_DIR, dir);

    if (fs.existsSync(srcPath)) {
      try {
        copyDirectory(srcPath, destPath);
        copiedCount++;
      } catch (error) {
        console.error(`✗ Error copying directory ${dir}:`, error.message);
        errorCount++;
      }
    } else {
      console.warn(`⚠ Warning: Directory not found: ${dir}`);
    }
  });

  console.log(`\n✅ Icon copy completed!`);
  console.log(`   Directories processed: ${copiedCount}`);
  if (errorCount > 0) {
    console.log(`   Errors: ${errorCount}`);
    process.exit(1);
  }
}

main();

