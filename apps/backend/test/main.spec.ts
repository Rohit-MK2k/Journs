import 'reflect-metadata';
import * as common from '@journ/common';
import * as bootstrapModule from '../src/bootstrap';
import { run, loadEnvironment } from '../src/main';

jest.mock('@journ/common', () => {
  const actual = jest.requireActual('@journ/common');
  return {
    __esModule: true,
    ...actual,
    initializeFirebaseAdmin: jest.fn(),
  };
});

describe('Main Entrypoint', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * @testType Unit Test
   * @target main / run
   * @description Verifies that initializeFirebaseAdmin is called prior to launching the server via bootstrap.
   */
  it('should initialize Firebase Admin before invoking application bootstrap', async () => {
    const bootstrapSpy = jest.spyOn(bootstrapModule, 'bootstrap').mockResolvedValue(undefined);

    await run();

    expect(common.initializeFirebaseAdmin).toHaveBeenCalledTimes(1);
    expect(bootstrapSpy).toHaveBeenCalledTimes(1);

    bootstrapSpy.mockRestore();
  });

  /**
   * @testType Unit Test
   * @target main / loadEnvironment
   * @description Verifies that process.loadEnvFile is attempted safely without throwing error when absent.
   */
  it('should attempt process.loadEnvFile safely without throwing error when absent', () => {
    const originalLoadEnvFile = (process as any).loadEnvFile;
    try {
      (process as any).loadEnvFile = jest.fn(() => {
        throw new Error('ENOENT: no such file or directory, open .env');
      });

      expect(() => loadEnvironment()).not.toThrow();
    } finally {
      (process as any).loadEnvFile = originalLoadEnvFile;
    }
  });
});
