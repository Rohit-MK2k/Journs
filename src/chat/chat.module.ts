import { Module } from '@nestjs/common';
import { ChatController } from './presentation/controllers/chat.controller';
import { ChatService } from './services/chat.service';
import { EntryRepository } from '../entries/interfaces/entry-repository.interface';
import { HabitMemoryStore } from '../habit-memory/interfaces/habit-memory-store.interface';
import { AIProvider } from '../common/interfaces/ai-provider.interface';
import { EntriesModule } from '../entries/entries.module';
import { HabitMemoryModule } from '../habit-memory/habit-memory.module';

@Module({
  imports: [EntriesModule, HabitMemoryModule],
  controllers: [ChatController],
  providers: [
    {
      provide: ChatService,
      useFactory: (
        repo: EntryRepository,
        habitStore: HabitMemoryStore,
        aiProvider: AIProvider,
      ) => {
        return new ChatService(repo, habitStore, aiProvider);
      },
      inject: ['EntryRepository', 'HabitMemoryStore', 'AIProvider'],
    },
  ],
})
export class ChatModule {}
