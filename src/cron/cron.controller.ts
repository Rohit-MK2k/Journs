import { Controller, Post, Headers, UnauthorizedException, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from '../common/decorators/public.decorator';
import { HabitMemoryCronService } from '../habit-memory/infrastructure/jobs/habit-memory.cron';
import { AttachmentCleanupCronService } from '../entries/services/attachment-cleanup-cron.service';

@Controller('cron')
export class CronController {
  private readonly logger = new Logger(CronController.name);

  constructor(
    private readonly habitMemoryCronService: HabitMemoryCronService,
    private readonly attachmentCleanupCronService: AttachmentCleanupCronService,
  ) {}

  private verifySecret(headerSecret?: string): void {
    const expectedSecret = process.env.CRON_SECRET;
    if (expectedSecret && headerSecret !== expectedSecret) {
      this.logger.warn('Rejected unauthorized cron webhook invocation');
      throw new UnauthorizedException('Invalid or missing cron secret');
    }
  }

  @Public()
  @Post('habit-memory')
  @HttpCode(HttpStatus.OK)
  async triggerHabitMemory(@Headers('x-cron-secret') headerSecret?: string) {
    this.verifySecret(headerSecret);
    this.logger.log('Executing habit memory refresh via HTTP cron trigger');
    await this.habitMemoryCronService.refreshAllUsersHabitMemory();
    return { status: 'success', job: 'habit-memory', completedAt: new Date().toISOString() };
  }

  @Public()
  @Post('attachment-cleanup')
  @HttpCode(HttpStatus.OK)
  async triggerAttachmentCleanup(@Headers('x-cron-secret') headerSecret?: string) {
    this.verifySecret(headerSecret);
    this.logger.log('Executing attachment cleanup via HTTP cron trigger');
    const result = await this.attachmentCleanupCronService.cleanupOrphanAttachments();
    return { status: 'success', job: 'attachment-cleanup', result, completedAt: new Date().toISOString() };
  }

  @Public()
  @Post('all')
  @HttpCode(HttpStatus.OK)
  async triggerAll(@Headers('x-cron-secret') headerSecret?: string) {
    this.verifySecret(headerSecret);
    this.logger.log('Executing combined 02:00 AM maintenance jobs via HTTP cron trigger');
    await this.habitMemoryCronService.refreshAllUsersHabitMemory();
    const cleanupResult = await this.attachmentCleanupCronService.cleanupOrphanAttachments();
    return {
      status: 'success',
      job: 'all',
      cleanupResult,
      completedAt: new Date().toISOString(),
    };
  }
}
