/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@journ/account/(.*)$': '<rootDir>/src/$1',
    '^@journ/account$': '<rootDir>/src/index',
    '^@journ/common/(.*)$': '<rootDir>/../common/src/$1',
    '^@journ/common$': '<rootDir>/../common/src/index'
  },
  setupFiles: ['<rootDir>/test/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!@nestjs|@firebase|firebase-admin|jose|jwks-rsa)'
  ]
};
