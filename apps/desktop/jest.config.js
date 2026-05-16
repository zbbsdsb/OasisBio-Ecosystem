module.exports = {
  testEnvironment: 'jsdom',
  rootDir: './',
  setupFilesAfterEnv: ['<rootDir>/../../jest.setup.js'],
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}', '**/*.test.{ts,tsx}'],
  testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/dist-electron/'],
  moduleNameMapper: {
    '^@oasisbio/common-core(.*)$': '<rootDir>/../../packages/common-core/src$1',
    '^@oasisbio/common-api(.*)$': '<rootDir>/../../packages/common-api/src$1',
    '^@oasisbio/common-auth(.*)$': '<rootDir>/../../packages/common-auth/src$1',
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'] }],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 70,
      lines: 70,
      statements: 70,
    },
    performance: {
      branches: 80,
      functions: 80,
      lines: 75,
      statements: 75,
    },
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testTimeout: 30000,
  verbose: true,
};
