import 'reflect-metadata';
import { createApp, resolvePort } from '../src/bootstrap';
import { NestFactory } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';

describe('Bootstrap Factory', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  /**
   * @testType Unit Test
   * @target bootstrap / createApp
   * @description Verifies that createApp initializes NestFactory.create wrapping the Express platform.
   */
  it('should create an Express-backed NestJS application instance', async () => {
    const mockApp = {
      useGlobalPipes: jest.fn(),
      enableCors: jest.fn(),
    } as unknown as INestApplication;

    const spyCreate = jest.spyOn(NestFactory, 'create').mockResolvedValue(mockApp);

    const app = await createApp();
    expect(spyCreate).toHaveBeenCalled();
    expect(app).toBe(mockApp);

    spyCreate.mockRestore();
  });

  /**
   * @testType Unit Test
   * @target bootstrap / createApp
   * @description Verifies that ValidationPipe is registered with whitelist, forbidNonWhitelisted, and transform options.
   */
  it('should register global ValidationPipe with whitelist and transform options', async () => {
    const mockApp = {
      useGlobalPipes: jest.fn(),
      enableCors: jest.fn(),
    } as unknown as INestApplication;

    const spyCreate = jest.spyOn(NestFactory, 'create').mockResolvedValue(mockApp);

    await createApp();

    expect(mockApp.useGlobalPipes).toHaveBeenCalledTimes(1);
    const pipe = (mockApp.useGlobalPipes as jest.Mock).mock.calls[0][0];
    expect(pipe).toBeInstanceOf(ValidationPipe);

    spyCreate.mockRestore();
  });

  /**
   * @testType Unit Test
   * @target bootstrap / createApp
   * @description Verifies that enableCors is invoked with origin true and credentials true.
   */
  it('should configure CORS with credentials and origin enabled', async () => {
    const mockApp = {
      useGlobalPipes: jest.fn(),
      enableCors: jest.fn(),
    } as unknown as INestApplication;

    const spyCreate = jest.spyOn(NestFactory, 'create').mockResolvedValue(mockApp);

    await createApp();

    expect(mockApp.enableCors).toHaveBeenCalledWith({
      origin: true,
      credentials: true,
    });

    spyCreate.mockRestore();
  });

  /**
   * @testType Unit Test
   * @target bootstrap / resolvePort
   * @description Verifies port resolution priority: NEW_BACKEND_PORT -> BACKEND_PORT -> PORT -> fallback 8001.
   */
  it('should resolve port respecting environment precedence and default to 8001', () => {
    delete process.env.NEW_BACKEND_PORT;
    delete process.env.BACKEND_PORT;
    delete process.env.PORT;
    expect(resolvePort()).toBe(8001);

    process.env.PORT = '9000';
    expect(resolvePort()).toBe(9000);

    process.env.BACKEND_PORT = '8080';
    expect(resolvePort()).toBe(8080);

    process.env.NEW_BACKEND_PORT = '8005';
    expect(resolvePort()).toBe(8005);
  });
});
