/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@journ/habit-memory/(.*)$': '<rootDir>/src/$1',
    '^@journ/habit-memory$': '<rootDir>/src/index',
    '^@journ/common/(.*)$': '<rootDir>/../common/src/$1',
    '^@journ/common$': '<rootDir>/../common/src/index',
    '^@journ/entries/(.*)$': '<rootDir>/../entries/src/$1',
    '^@journ/entries$': '<rootDir>/../entries/src/index'
  },
  setupFiles: ['<rootDir>/test/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!@nestjs|@firebase|firebase-admin|jose|jwks-rsa)'
  ]
};
