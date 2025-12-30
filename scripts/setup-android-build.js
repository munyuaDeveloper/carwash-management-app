#!/usr/bin/env node

/**
 * Script to set up Android build environment
 * Ensures all necessary files exist for building, even after deleting android folder
 * This should be run before any Android build
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECT_ROOT = path.join(__dirname, '..');
const ANDROID_DIR = path.join(PROJECT_ROOT, 'android');
const GRADLE_PROPERTIES = path.join(ANDROID_DIR, 'gradle.properties');
const LOCAL_PROPERTIES = path.join(ANDROID_DIR, 'local.properties');

function findAndroidSDK() {
  // Common Android SDK locations
  const possiblePaths = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    path.join(os.homedir(), 'Library', 'Android', 'sdk'),
    path.join(os.homedir(), 'Android', 'Sdk'),
    path.join(os.homedir(), '.android', 'sdk'),
    '/Users/Shared/Android/sdk',
    process.env.LOCALAPPDATA ? path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk') : null,
    process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'Local', 'Android', 'Sdk') : null,
  ].filter(Boolean);

  for (const sdkPath of possiblePaths) {
    if (sdkPath && fs.existsSync(sdkPath)) {
      // Verify it's actually an Android SDK by checking for common directories
      if (fs.existsSync(path.join(sdkPath, 'platform-tools'))) {
        return sdkPath;
      }
    }
  }

  return null;
}

function ensureLocalProperties() {
  console.log('📝 Setting up local.properties...');

  // Create android directory if it doesn't exist (minimal structure)
  if (!fs.existsSync(ANDROID_DIR)) {
    console.log('   ⚠️  android directory not found.');
    console.log('   ℹ️  If you deleted it, run: npm run expo:prebuild:android');
    console.log('   ℹ️  Creating minimal structure for now...');
    fs.mkdirSync(ANDROID_DIR, { recursive: true });
  }

  let sdkPath = null;
  let shouldWrite = false;

  // Check if local.properties exists
  if (fs.existsSync(LOCAL_PROPERTIES)) {
    const content = fs.readFileSync(LOCAL_PROPERTIES, 'utf8');
    const match = content.match(/sdk\.dir=(.+)/);
    if (match) {
      sdkPath = match[1].trim();
      // Verify the path still exists
      if (!fs.existsSync(sdkPath)) {
        console.log(`   ⚠️  SDK path in local.properties doesn't exist: ${sdkPath}`);
        shouldWrite = true;
      }
    } else {
      shouldWrite = true;
    }
  } else {
    shouldWrite = true;
  }

  // Find SDK if needed
  if (shouldWrite || !sdkPath) {
    console.log('   Searching for Android SDK...');
    sdkPath = findAndroidSDK();

    if (!sdkPath) {
      console.error('   ✗ Android SDK not found!');
      console.error('   Please set ANDROID_HOME or ANDROID_SDK_ROOT environment variable,');
      console.error('   or install Android SDK and run this script again.');
      console.error('');
      console.error('   Common locations:');
      console.error('   - macOS: ~/Library/Android/sdk');
      console.error('   - Linux: ~/Android/Sdk');
      console.error('   - Windows: %LOCALAPPDATA%\\Android\\Sdk');
      return false;
    }

    console.log(`   ✓ Found Android SDK at: ${sdkPath}`);
  } else {
    console.log(`   ✓ Using existing SDK path: ${sdkPath}`);
  }

  // Write local.properties
  if (shouldWrite) {
    const content = `sdk.dir=${sdkPath}\n`;
    fs.writeFileSync(LOCAL_PROPERTIES, content);
    console.log(`   ✓ Created/updated local.properties`);
  }

  return true;
}

function ensureGradleProperties() {
  console.log('📝 Checking gradle.properties...');

  if (!fs.existsSync(GRADLE_PROPERTIES)) {
    console.log('   ⚠️  gradle.properties not found.');
    console.log('   ℹ️  If android folder was deleted, run: npm run expo:prebuild:android');
    console.log('   ℹ️  Or it will be created automatically by Expo prebuild.');
    return true;
  }

  // Read existing gradle.properties
  let content = fs.readFileSync(GRADLE_PROPERTIES, 'utf8');

  // Ensure required settings are present and override existing values
  const requiredSettings = {
    // Code and resource optimization
    'android.enableMinifyInReleaseBuilds': 'true',
    'android.enableShrinkResourcesInReleaseBuilds': 'true',
    'android.enableBundleCompression': 'true',
    'android.enableR8.fullMode': 'true',
    // Architecture optimization - only arm64-v8a for smaller APK size (covers 99%+ of modern devices)
    'reactNativeArchitectures': 'arm64-v8a',
    // Build performance optimizations
    'org.gradle.caching': 'true',
    'org.gradle.configureondemand': 'true',
    'org.gradle.daemon': 'true',
  };

  let updated = false;
  for (const [key, value] of Object.entries(requiredSettings)) {
    const escapedKey = key.replace(/\./g, '\\.');
    const regex = new RegExp(`^${escapedKey}=.*$`, 'm');

    if (regex.test(content)) {
      // Replace existing value
      content = content.replace(regex, `${key}=${value}`);
      updated = true;
      console.log(`   ✓ Updated ${key}=${value}`);
    } else {
      // Add the setting if it doesn't exist
      content += `\n# ${key} - Added by setup script\n${key}=${value}\n`;
      updated = true;
      console.log(`   ✓ Added ${key}=${value}`);
    }
  }

  if (updated) {
    fs.writeFileSync(GRADLE_PROPERTIES, content);
    console.log('   ✓ Updated gradle.properties');
  } else {
    console.log('   ✓ gradle.properties is properly configured');
  }

  return true;
}

function ensureDirectories() {
  console.log('📁 Ensuring required directories exist...');

  const requiredDirs = [
    ANDROID_DIR,
    path.join(ANDROID_DIR, 'app'),
    path.join(ANDROID_DIR, 'app', 'src', 'main'),
    path.join(ANDROID_DIR, 'app', 'src', 'main', 'res'),
  ];

  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`   ✓ Created: ${path.relative(PROJECT_ROOT, dir)}`);
    }
  }

  return true;
}

function main() {
  console.log('🔧 Setting up Android build environment...\n');

  let success = true;

  // Step 1: Ensure android directory structure
  if (!ensureDirectories()) {
    success = false;
  }

  console.log('');

  // Step 2: Set up local.properties
  if (!ensureLocalProperties()) {
    success = false;
  }

  console.log('');

  // Step 3: Ensure gradle.properties has optimization settings
  if (!ensureGradleProperties()) {
    success = false;
  }

  console.log('');

  if (success) {
    console.log('✅ Android build environment setup complete!');
    console.log('');

    // Check if android folder has proper structure
    const hasAppDir = fs.existsSync(path.join(ANDROID_DIR, 'app', 'build.gradle'));
    if (!hasAppDir) {
      console.log('⚠️  Note: Android native code not found.');
      console.log('   Run this to regenerate: npm run expo:prebuild:android');
      console.log('');
    }

    console.log('You can now build the APK with:');
    console.log('  npm run build:android');
  } else {
    console.error('❌ Setup incomplete. Please fix the errors above.');
    process.exit(1);
  }
}

main();

