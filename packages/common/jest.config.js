/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@journ/common/(.*)$': '<rootDir>/src/$1',
    '^@journ/common$': '<rootDir>/src/index'
  },
  transformIgnorePatterns: [
    'node_modules/(?!@nestjs|@firebase|firebase-admin|jose|jwks-rsa)'
  ]
};
