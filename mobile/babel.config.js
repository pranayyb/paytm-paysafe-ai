module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    '@babel/plugin-transform-export-namespace-from',
    [
      'module-resolver',
      {
        root: ['./src'],
        alias: {
          '@screens': './src/screens',
          '@components': './src/components',
          '@navigation': './src/navigation',
          '@store': './src/store',
          '@utils': './src/utils',
          '@theme': './src/theme/index.ts',
          '@assets': './src/assets',
          '@config': './src/config',
          '@services': './src/services',
        },
      },
    ],
    'react-native-reanimated/plugin', // MUST be last
  ],
};
