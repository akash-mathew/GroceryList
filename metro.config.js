const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add web support
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Resolve platform-specific extensions
config.resolver.resolverMainFields = ['browser', 'main'];

module.exports = config;
