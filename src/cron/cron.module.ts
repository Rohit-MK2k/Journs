import { Module } from '@nestjs/common';
import { CronController } from './cron.controller';
import { HabitMemoryModule } from '../habit-memory/habit-memory.module';
import { EntriesModule } from '../entries/entries.module';

@Module({
  imports: [HabitMemoryModule, EntriesModule],
  controllers: [CronController],
})
export class CronModule {}
