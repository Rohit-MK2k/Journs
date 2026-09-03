import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { EntriesModule } from './entries/entries.module';
import { ChatModule } from './chat/chat.module';
import { HabitMemoryModule } from './habit-memory/habit-memory.module';

import { APP_FILTER } from '@nestjs/core';
import { DomainExceptionFilter } from './common/presentation/filters/domain-exception.filter';

@Module({
  imports: [
    CommonModule,
    EntriesModule,
    HabitMemoryModule,
    ChatModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
  ],
})
export class AppModule {}
