module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  reporters: [ "default", "jest-junit"],
  modulePathIgnorePatterns : ["/dist"],
  transformIgnorePatterns: ["/node_modules/(?!@youwol)"]
};
