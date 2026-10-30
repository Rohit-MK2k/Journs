import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { HabitMemoryService } from '../../services/habit-memory.service';
import { getAuth } from 'firebase-admin/auth';

@Injectable()
export class HabitMemoryCronService {
  private readonly logger = new Logger(HabitMemoryCronService.name);

  constructor(private readonly habitMemoryService: HabitMemoryService) {}

  // Run at 2 AM every day
  @Cron('0 2 * * *')
  async refreshAllUsersHabitMemory(): Promise<void> {
    this.logger.log('Starting daily habit memory refresh job...');
    try {
      const listUsersResult = await getAuth().listUsers(1000);

      for (const userRecord of listUsersResult.users) {
        try {
          await this.habitMemoryService.refreshMemory(userRecord.uid);
          this.logger.debug(`Refreshed habit memory for user ${userRecord.uid}`);
        } catch (err) {
          this.logger.error(`Failed to refresh memory for user ${userRecord.uid}`, err);
        }
      }
      this.logger.log('Finished daily habit memory refresh job.');
    } catch (error) {
      this.logger.error('Error during global habit memory refresh', error);
    }
  }
}
