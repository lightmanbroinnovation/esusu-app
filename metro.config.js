const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Add custom resolver to debug undefined paths
config.resolver.resolveRequest = (context, moduleName, platform) => {
    // Log problematic modules to help debug
    if (!context.originModulePath) {
        console.warn(`[Metro Debug] No origin path for module: ${moduleName}`);
    }

    try {
        // Use default resolution
        return context.resolveRequest(context, moduleName, platform);
    } catch (error) {
        console.error(`[Metro Error] Failed to resolve: ${moduleName}`);
        console.error(`  Origin: ${context.originModulePath || 'undefined'}`);
        throw error;
    }
};

module.exports = config;
