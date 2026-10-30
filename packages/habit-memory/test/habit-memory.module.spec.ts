import { Test } from '@nestjs/testing';
import { CommonModule } from '@journ/common';

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(() => ({
    listUsers: jest.fn().mockResolvedValue({ users: [] }),
  })),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        get: jest.fn(),
        set: jest.fn(),
      })),
    })),
  })),
}));

import { HabitMemoryModule } from '@journ/habit-memory/habit-memory.module';
import { HabitMemoryController } from '@journ/habit-memory/presentation/controllers/habit-memory.controller';
import { HabitMemoryService } from '@journ/habit-memory/services/habit-memory.service';
import { HabitMemoryCronService } from '@journ/habit-memory/infrastructure/jobs/habit-memory.cron';
import { FirestoreHabitMemoryStore } from '@journ/habit-memory/infrastructure/repositories/firestore-habit-memory.store';

describe('HabitMemoryModule', () => {
  /**
   * @testType Integration Test
   * @target HabitMemoryModule
   * @description Verifies that the NestJS DI container compiles HabitMemoryModule and resolves all controllers, services, and store tokens.
   */
  it('should compile HabitMemoryModule and resolve controllers and providers', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CommonModule, HabitMemoryModule],
    })
      .overrideProvider('EntryRepository')
      .useValue({ listRecent: jest.fn() })
      .overrideProvider('AIProvider')
      .useValue({ deriveHabitMemory: jest.fn() })
      .overrideProvider('StorageProvider')
      .useValue({})
      .overrideProvider('GENAI_CLIENT')
      .useValue({})
      .overrideProvider('VERTEX_INDEX_CLIENT')
      .useValue({})
      .overrideProvider('VERTEX_MATCH_CLIENT')
      .useValue({})
      .compile();

    expect(moduleRef).toBeDefined();
    expect(moduleRef.get(HabitMemoryController)).toBeDefined();
    expect(moduleRef.get(HabitMemoryService)).toBeDefined();
    expect(moduleRef.get(HabitMemoryCronService)).toBeDefined();
    expect(moduleRef.get('HabitMemoryStore')).toBeInstanceOf(FirestoreHabitMemoryStore);
  });
});
