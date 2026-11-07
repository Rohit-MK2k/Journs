/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.spec.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: {
    '^@journ/backend/(.*)$': '<rootDir>/src/$1',
    '^@journ/backend$': '<rootDir>/src/index',
    '^@journ/common/(.*)$': '<rootDir>/../../packages/common/src/$1',
    '^@journ/common$': '<rootDir>/../../packages/common/src/index',
    '^@journ/account/(.*)$': '<rootDir>/../../packages/account/src/$1',
    '^@journ/account$': '<rootDir>/../../packages/account/src/index',
    '^@journ/entries/(.*)$': '<rootDir>/../../packages/entries/src/$1',
    '^@journ/entries$': '<rootDir>/../../packages/entries/src/index',
    '^@journ/habit-memory/(.*)$': '<rootDir>/../../packages/habit-memory/src/$1',
    '^@journ/habit-memory$': '<rootDir>/../../packages/habit-memory/src/index',
    '^@journ/chat/(.*)$': '<rootDir>/../../packages/chat/src/$1',
    '^@journ/chat$': '<rootDir>/../../packages/chat/src/index',
    '^@journ/cron/(.*)$': '<rootDir>/../../packages/cron/src/$1',
    '^@journ/cron$': '<rootDir>/../../packages/cron/src/index'
  },
  setupFiles: ['<rootDir>/test/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!@nestjs|@firebase|firebase-admin|jose|jwks-rsa)'
  ]
};
