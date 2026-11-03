import { Test } from '@nestjs/testing';
import { CommonModule } from '@journ/common';
import { CronModule } from '@journ/cron/cron.module';
import { CronController } from '@journ/cron/presentation/controllers/cron.controller';
import { HabitMemoryCronService } from '@journ/habit-memory';
import { AttachmentCleanupCronService } from '@journ/entries';

describe('CronModule', () => {
  /**
   * @testType Integration Test
   * @target CronModule
   * @description Verifies that the NestJS DI container compiles CronModule and successfully resolves CronController.
   */
  it('should compile CronModule and resolve CronController', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CommonModule, CronModule],
    })
      .overrideProvider(HabitMemoryCronService)
      .useValue({
        refreshAllUsersHabitMemory: jest.fn(),
      })
      .overrideProvider(AttachmentCleanupCronService)
      .useValue({
        cleanupOrphanAttachments: jest.fn(),
      })
      .overrideProvider('HabitMemoryStore')
      .useValue({})
      .overrideProvider('EntryRepository')
      .useValue({})
      .overrideProvider('PendingAttachmentRepository')
      .useValue({})
      .overrideProvider('StorageProvider')
      .useValue({})
      .overrideProvider('AIProvider')
      .useValue({})
      .overrideProvider('GENAI_CLIENT')
      .useValue({})
      .overrideProvider('VERTEX_INDEX_CLIENT')
      .useValue({})
      .overrideProvider('VERTEX_MATCH_CLIENT')
      .useValue({})
      .compile();

    const controller = moduleRef.get<CronController>(CronController);
    expect(controller).toBeDefined();
  });
});
