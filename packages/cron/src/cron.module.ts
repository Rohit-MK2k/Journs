import { Module } from '@nestjs/common';
import { CronController } from './presentation/controllers/cron.controller';
import { HabitMemoryModule } from '@journ/habit-memory';
import { EntriesModule } from '@journ/entries';

@Module({
  imports: [HabitMemoryModule, EntriesModule],
  controllers: [CronController],
})
export class CronModule {}
