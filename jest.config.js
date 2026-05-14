module.exports = {
  projects: [
    '<rootDir>/packages/common-core/jest.config.js',
    '<rootDir>/packages/common-api/jest.config.js',
    '<rootDir>/apps/desktop/jest.config.js',
  ],
  coverageReporters: ['text', 'lcov', 'html'],
};
