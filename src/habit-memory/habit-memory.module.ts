import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HabitMemoryService } from './services/habit-memory.service';
import { FirestoreHabitMemoryStore } from './infrastructure/repositories/firestore-habit-memory.store';
import { HabitMemoryCronService } from './infrastructure/jobs/habit-memory.cron';
import { EntryRepository } from '../entries/interfaces/entry-repository.interface';
import { HabitMemoryStore } from './interfaces/habit-memory-store.interface';
import { AIProvider } from '../common/interfaces/ai-provider.interface';
import { EntriesModule } from '../entries/entries.module';

@Module({
  imports: [EntriesModule, ScheduleModule.forRoot()],
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
  exports: ['HabitMemoryStore', HabitMemoryService],
})
export class HabitMemoryModule {}
