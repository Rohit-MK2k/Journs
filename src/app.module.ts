import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { EntriesModule } from './entries/entries.module';
import { ChatModule } from './chat/chat.module';
import { HabitMemoryModule } from './habit-memory/habit-memory.module';

@Module({
  imports: [
    CommonModule,
    EntriesModule,
    HabitMemoryModule,
    ChatModule,
  ],
})
export class AppModule {}
