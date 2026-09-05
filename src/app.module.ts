import { Module } from '@nestjs/common';
import { CommonModule } from './common/common.module';
import { EntriesModule } from './entries/entries.module';
import { ChatModule } from './chat/chat.module';
import { HabitMemoryModule } from './habit-memory/habit-memory.module';
import { AccountModule } from './account/account.module';

import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { DomainExceptionFilter } from './common/presentation/filters/domain-exception.filter';
import { FirebaseAuthGuard } from './common/guards/firebase-auth.guard';

@Module({
  imports: [
    CommonModule,
    EntriesModule,
    HabitMemoryModule,
    ChatModule,
    AccountModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: FirebaseAuthGuard,
    },
  ],
})
export class AppModule {}
