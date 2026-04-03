const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

const ALIASES = {
  '@screens': path.resolve(__dirname, 'src/screens'),
  '@components': path.resolve(__dirname, 'src/components'),
  '@navigation': path.resolve(__dirname, 'src/navigation'),
  '@store': path.resolve(__dirname, 'src/store'),
  '@utils': path.resolve(__dirname, 'src/utils'),
  '@theme': path.resolve(__dirname, 'src/theme/index.ts'),
  '@assets': path.resolve(__dirname, 'src/assets'),
  '@config': path.resolve(__dirname, 'src/config'),
  '@services': path.resolve(__dirname, 'src/services'),
};

const config = {
  resolver: {
    resolveRequest: (context, moduleName, platform) => {
      for (const [alias, aliasPath] of Object.entries(ALIASES)) {
        if (moduleName === alias) {
          return context.resolveRequest(context, aliasPath, platform);
        }
        if (moduleName.startsWith(alias + '/')) {
          const rest = moduleName.slice(alias.length + 1);
          const resolved = path.join(aliasPath, rest);
          return context.resolveRequest(context, resolved, platform);
        }
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
