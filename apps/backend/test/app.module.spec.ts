import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import {
  HealthController,
  DomainExceptionFilter,
  FirebaseAuthGuard,
} from '@journ/common';
import { AccountController } from '@journ/account';
import { EntriesController } from '@journ/entries';
import { HabitMemoryController } from '@journ/habit-memory';
import { ChatController } from '@journ/chat';
import { CronController } from '@journ/cron';

function getGlobalProvider<T>(ref: TestingModule, tokenPrefix: string): T {
  for (const [, module] of (ref as any).container.getModules()) {
    for (const [pKey, provider] of (module as any).providers) {
      if (typeof pKey === 'string' && pKey.startsWith(tokenPrefix)) {
        return (provider as any).instance as T;
      }
    }
  }
  throw new Error(`Provider starting with token prefix "${tokenPrefix}" not found`);
}

describe('AppModule Integration', () => {
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider('AIProvider')
      .useValue({
        processChatTurn: jest.fn(),
        extractContext: jest.fn(),
      })
      .overrideProvider('StorageProvider')
      .useValue({})
      .overrideProvider('GENAI_CLIENT')
      .useValue({})
      .overrideProvider('VERTEX_INDEX_CLIENT')
      .useValue({})
      .overrideProvider('VERTEX_MATCH_CLIENT')
      .useValue({})
      .compile();
  });

  afterAll(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  /**
   * @testType Integration Test
   * @target AppModule
   * @description Verifies that the NestJS DI container compiles AppModule and resolves controllers from all six domain packages.
   */
  it('should compile AppModule and resolve all six domain controllers', () => {
    expect(moduleRef).toBeDefined();

    const healthController = moduleRef.get<HealthController>(HealthController);
    const accountController = moduleRef.get<AccountController>(AccountController);
    const entriesController = moduleRef.get<EntriesController>(EntriesController);
    const habitMemoryController = moduleRef.get<HabitMemoryController>(HabitMemoryController);
    const chatController = moduleRef.get<ChatController>(ChatController);
    const cronController = moduleRef.get<CronController>(CronController);

    expect(healthController).toBeDefined();
    expect(accountController).toBeDefined();
    expect(entriesController).toBeDefined();
    expect(habitMemoryController).toBeDefined();
    expect(chatController).toBeDefined();
    expect(cronController).toBeDefined();
  });

  /**
   * @testType Integration Test
   * @target AppModule
   * @description Verifies that APP_FILTER provider token is registered with DomainExceptionFilter.
   */
  it('should register DomainExceptionFilter as global APP_FILTER', () => {
    const filter = getGlobalProvider<DomainExceptionFilter>(moduleRef, APP_FILTER);
    expect(filter).toBeDefined();
    expect(filter).toBeInstanceOf(DomainExceptionFilter);
  });

  /**
   * @testType Integration Test
   * @target AppModule
   * @description Verifies that APP_GUARD provider token is registered with FirebaseAuthGuard.
   */
  it('should register FirebaseAuthGuard as global APP_GUARD', () => {
    const guard = getGlobalProvider<FirebaseAuthGuard>(moduleRef, APP_GUARD);
    expect(guard).toBeDefined();
    expect(guard).toBeInstanceOf(FirebaseAuthGuard);
  });

  /**
   * @testType Integration Test
   * @target AppModule / HealthController
   * @description Verifies that GET /health route responds with status ok without requiring authentication.
   */
  it('should respond with status ok on health check without authentication', () => {
    const healthController = moduleRef.get<HealthController>(HealthController);
    const result = healthController.checkHealth();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('journ-backend');
  });

  /**
   * @testType Integration Test
   * @target AppModule / FirebaseAuthGuard
   * @description Verifies that calling a protected domain route like GET /entries without auth token returns 401 Unauthorized.
   */
  it('should reject unauthenticated request to protected route GET /entries with 401 Unauthorized', async () => {
    const guard = getGlobalProvider<FirebaseAuthGuard>(moduleRef, APP_GUARD);
    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
      getHandler: () => EntriesController.prototype.getTimeline,
      getClass: () => EntriesController,
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(mockContext)).rejects.toThrow(UnauthorizedException);
  });

  /**
   * @testType Integration Test
   * @target AppModule / CronController
   * @description Verifies that @Public() endpoint POST /cron/habit-memory bypasses FirebaseAuthGuard.
   */
  it('should permit @Public() endpoint POST /cron/habit-memory without bearer token', async () => {
    const guard = getGlobalProvider<FirebaseAuthGuard>(moduleRef, APP_GUARD);
    const cronController = moduleRef.get<CronController>(CronController);
    expect(cronController).toBeDefined();

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: {} }),
      }),
      getHandler: () => CronController.prototype.triggerHabitMemory,
      getClass: () => CronController,
    } as unknown as ExecutionContext;

    const canActivate = await guard.canActivate(mockContext);
    expect(canActivate).toBe(true);
  });
});
