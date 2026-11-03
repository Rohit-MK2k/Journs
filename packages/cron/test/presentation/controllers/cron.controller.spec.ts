import { UnauthorizedException } from '@nestjs/common';
import { CronController } from '@journ/cron/presentation/controllers/cron.controller';
import { HabitMemoryCronService } from '@journ/habit-memory';
import { AttachmentCleanupCronService } from '@journ/entries';

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
    /**
     * @testType Unit Test
     * @target CronController.triggerHabitMemory
     * @description Verifies that triggerHabitMemory executes habitMemoryCronService when no CRON_SECRET is configured.
     */
    it('should execute when no CRON_SECRET is configured', async () => {
      delete process.env.CRON_SECRET;
      const res = await controller.triggerHabitMemory();
      expect(habitCronMock.refreshAllUsersHabitMemory).toHaveBeenCalled();
      expect(res.status).toBe('success');
      expect(res.job).toBe('habit-memory');
    });

    /**
     * @testType Unit Test
     * @target CronController.triggerHabitMemory
     * @description Verifies that triggerHabitMemory executes habitMemoryCronService when matching CRON_SECRET header is provided.
     */
    it('should execute when matching CRON_SECRET header is provided', async () => {
      process.env.CRON_SECRET = 'secure-key-123';
      const res = await controller.triggerHabitMemory('secure-key-123');
      expect(habitCronMock.refreshAllUsersHabitMemory).toHaveBeenCalled();
      expect(res.status).toBe('success');
    });

    /**
     * @testType Unit Test
     * @target CronController.triggerHabitMemory
     * @description Verifies that triggerHabitMemory throws UnauthorizedException when CRON_SECRET is configured but header is missing or mismatched.
     */
    it('should throw UnauthorizedException when CRON_SECRET header is missing or mismatch', async () => {
      process.env.CRON_SECRET = 'secure-key-123';
      await expect(controller.triggerHabitMemory('wrong-key')).rejects.toThrow(UnauthorizedException);
      await expect(controller.triggerHabitMemory()).rejects.toThrow(UnauthorizedException);
      expect(habitCronMock.refreshAllUsersHabitMemory).not.toHaveBeenCalled();
    });
  });

  describe('triggerAttachmentCleanup', () => {
    /**
     * @testType Unit Test
     * @target CronController.triggerAttachmentCleanup
     * @description Verifies that triggerAttachmentCleanup executes attachmentCleanupCronService when header matches secret.
     */
    it('should execute when header matches secret', async () => {
      process.env.CRON_SECRET = 'secure-key-123';
      const res = await controller.triggerAttachmentCleanup('secure-key-123');
      expect(cleanupCronMock.cleanupOrphanAttachments).toHaveBeenCalled();
      expect(res.status).toBe('success');
      expect(res.result).toEqual({ totalOrphans: 2, cleanedCount: 2 });
    });
  });

  describe('triggerAll', () => {
    /**
     * @testType Unit Test
     * @target CronController.triggerAll
     * @description Verifies that triggerAll executes both habit memory refresh and attachment cleanup when secret matches.
     */
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
