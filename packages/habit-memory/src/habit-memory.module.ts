import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HabitMemoryService } from './services/habit-memory.service';
import { FirestoreHabitMemoryStore } from './infrastructure/repositories/firestore-habit-memory.store';
import { HabitMemoryCronService } from './infrastructure/jobs/habit-memory.cron';
import { HabitMemoryStore } from './interfaces/habit-memory-store.interface';
import { HabitMemoryController } from './presentation/controllers/habit-memory.controller';
import { EntriesModule, EntryRepository } from '@journ/entries';
import { AIProvider } from '@journ/common';

@Module({
  imports: [EntriesModule, ScheduleModule.forRoot()],
  controllers: [HabitMemoryController],
  providers: [
    {
      provide: 'HabitMemoryStore',
      useClass: FirestoreHabitMemoryStore,
    },
    {
      provide: HabitMemoryService,
      useFactory: (
        repo: EntryRepository,
        store: HabitMemoryStore,
        aiProvider: AIProvider,
      ) => {
        return new HabitMemoryService(repo, store, aiProvider);
      },
      inject: ['EntryRepository', 'HabitMemoryStore', 'AIProvider'],
    },
    HabitMemoryCronService,
  ],
  exports: ['HabitMemoryStore', HabitMemoryService, HabitMemoryCronService],
})
export class HabitMemoryModule {}
