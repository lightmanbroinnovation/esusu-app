module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.expo/',
    '<rootDir>/android/',
    '<rootDir>/ios/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@expo|expo|@unimodules|unimodules|@react-navigation|react-navigation|@react-native-community|@react-native-async-storage|@react-native-community/netinfo|@react-native-community/datetimepicker|@react-native-picker|@react-navigation/bottom-tabs|@react-navigation/native|@reduxjs/toolkit|react-redux|axios|cloudinary|cloudinary-core|moment|moti|nativewind|react-native-css-interop|react-native-date-picker|react-native-datepicker|react-native-dotenv|react-native-gesture-handler|react-native-reanimated|react-native-safe-area-context|react-native-screens|react-native-skeleton-placeholder|react-native-web|react-native-webview|tailwindcss)',
  ],
  collectCoverageFrom: [
    'app/**/*.{ts,tsx}',
    'services/**/*.{ts,tsx,js}',
    'config/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/coverage/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@app/(.*)$': '<rootDir>/app/$1',
    '^@services/(.*)$': '<rootDir>/services/$1',
    '^@config/(.*)$': '<rootDir>/config/$1',
    '^@utils/(.*)$': '<rootDir>/app/utils/$1',
    '^@components/(.*)$': '<rootDir>/app/components/$1',
    '^@types/(.*)$': '<rootDir>/app/types/$1',
  },
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/jest.setup.js'],
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)',
  ],
  verbose: true,
};
