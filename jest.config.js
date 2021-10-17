module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  reporters: ['default', 'jest-junit', 'jest-sonar'],
  modulePathIgnorePatterns: ['/dist'],
  transformIgnorePatterns: ['/node_modules/(?!@youwol)'],
}
