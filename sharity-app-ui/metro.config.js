const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.maxWorkers = 2;
// TypeScript is the source of truth; emitted JS siblings must not shadow it.
config.resolver.sourceExts = ['tsx', 'ts', 'jsx', 'js', 'mjs', 'cjs', 'json'];
module.exports = config;
