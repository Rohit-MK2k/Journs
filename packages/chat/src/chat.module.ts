import { Module } from '@nestjs/common';
import { ChatController } from './presentation/controllers/chat.controller';
import { ChatService } from './services/chat.service';
import { EntryRepository, EntriesModule } from '@journ/entries';
import { HabitMemoryStore, HabitMemoryModule } from '@journ/habit-memory';
import { AIProvider } from '@journ/common';

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
  exports: [ChatService],
})
export class ChatModule {}
