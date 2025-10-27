const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

// Ensure we're using the correct project root
const projectRoot = path.resolve(__dirname);

const config = getDefaultConfig(projectRoot);

// Configure NativeWind with proper paths
const nativeWindConfig = withNativeWind(config, {
  input: './global.css',
  configPath: path.resolve(projectRoot, 'tailwind.config.js')
});

module.exports = nativeWindConfig;