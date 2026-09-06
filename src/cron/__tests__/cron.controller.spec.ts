import { UnauthorizedException } from '@nestjs/common';
import { CronController } from '../cron.controller';
import { HabitMemoryCronService } from '../../habit-memory/infrastructure/jobs/habit-memory.cron';
import { AttachmentCleanupCronService } from '../../entries/services/attachment-cleanup-cron.service';

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(),
}));

describe('CronController', () => {
  let controller: CronController;
  let habitCronMock: jest.Mocked<Partial<HabitMemoryCronService>>;
  let cleanupCronMock: jest.Mocked<Partial<AttachmentCleanupCronService>>;

  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    habitCronMock = {
      refreshAllUsersHabitMemory: jest.fn().mockResolvedValue(undefined),
    };
    cleanupCronMock = {
      cleanupOrphanAttachments: jest.fn().mockResolvedValue({ totalOrphans: 2, cleanedCount: 2 }),
    };

    controller = new CronController(
      habitCronMock as HabitMemoryCronService,
      cleanupCronMock as AttachmentCleanupCronService,
    );
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('triggerHabitMemory', () => {
    it('should execute when no CRON_SECRET is configured', async () => {
      delete process.env.CRON_SECRET;
      const res = await controller.triggerHabitMemory();
      expect(habitCronMock.refreshAllUsersHabitMemory).toHaveBeenCalled();
      expect(res.status).toBe('success');
      expect(res.job).toBe('habit-memory');
    });

    it('should execute when matching CRON_SECRET header is provided', async () => {
      process.env.CRON_SECRET = 'secure-key-123';
      const res = await controller.triggerHabitMemory('secure-key-123');
      expect(habitCronMock.refreshAllUsersHabitMemory).toHaveBeenCalled();
      expect(res.status).toBe('success');
    });

    it('should throw UnauthorizedException when CRON_SECRET header is missing or mismatch', async () => {
      process.env.CRON_SECRET = 'secure-key-123';
      await expect(controller.triggerHabitMemory('wrong-key')).rejects.toThrow(UnauthorizedException);
      await expect(controller.triggerHabitMemory()).rejects.toThrow(UnauthorizedException);
      expect(habitCronMock.refreshAllUsersHabitMemory).not.toHaveBeenCalled();
    });
  });

  describe('triggerAttachmentCleanup', () => {
    it('should execute when header matches secret', async () => {
      process.env.CRON_SECRET = 'secure-key-123';
      const res = await controller.triggerAttachmentCleanup('secure-key-123');
      expect(cleanupCronMock.cleanupOrphanAttachments).toHaveBeenCalled();
      expect(res.status).toBe('success');
      expect(res.result).toEqual({ totalOrphans: 2, cleanedCount: 2 });
    });
  });

  describe('triggerAll', () => {
    it('should execute both maintenance routines', async () => {
      process.env.CRON_SECRET = 'secure-key-123';
      const res = await controller.triggerAll('secure-key-123');
      expect(habitCronMock.refreshAllUsersHabitMemory).toHaveBeenCalled();
      expect(cleanupCronMock.cleanupOrphanAttachments).toHaveBeenCalled();
      expect(res.status).toBe('success');
      expect(res.job).toBe('all');
    });
  });
});
