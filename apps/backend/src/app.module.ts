import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import {
  CommonModule,
  DomainExceptionFilter,
  FirebaseAuthGuard,
} from '@journ/common';
import { AccountModule } from '@journ/account';
import { EntriesModule } from '@journ/entries';
import { HabitMemoryModule } from '@journ/habit-memory';
import { ChatModule } from '@journ/chat';
import { CronModule } from '@journ/cron';

@Module({
  imports: [
    CommonModule,
    AccountModule,
    EntriesModule,
    HabitMemoryModule,
    ChatModule,
    CronModule,
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
