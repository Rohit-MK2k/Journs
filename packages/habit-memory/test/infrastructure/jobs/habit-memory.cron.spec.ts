import { Test, TestingModule } from '@nestjs/testing';
import { HabitMemoryCronService } from '@journ/habit-memory/infrastructure/jobs/habit-memory.cron';
import { HabitMemoryService } from '@journ/habit-memory/services/habit-memory.service';
import { getAuth } from 'firebase-admin/auth';

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(),
}));

describe('HabitMemoryCronService', () => {
  let cronService: HabitMemoryCronService;
  let service: jest.Mocked<HabitMemoryService>;

  beforeEach(async () => {
    const mockService = {
      refreshMemory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HabitMemoryCronService,
        {
          provide: HabitMemoryService,
          useValue: mockService,
        },
      ],
    }).compile();

    cronService = module.get(HabitMemoryCronService);
    service = module.get(HabitMemoryService);
  });

  /**
   * @testType Unit Test
   * @target HabitMemoryCronService.refreshAllUsersHabitMemory
   * @description Verifies that the daily cron job iterates all users retrieved via Firebase Auth and triggers refreshMemory.
   */
  it('should refresh memory for all users', async () => {
    const mockUsers = [{ uid: 'user1' }, { uid: 'user2' }];
    (getAuth as jest.Mock).mockReturnValue({
      listUsers: jest.fn().mockResolvedValue({ users: mockUsers }),
    });

    await cronService.refreshAllUsersHabitMemory();

    expect(service.refreshMemory).toHaveBeenCalledWith('user1');
    expect(service.refreshMemory).toHaveBeenCalledWith('user2');
  });

  /**
   * @testType Unit Test
   * @target HabitMemoryCronService.refreshAllUsersHabitMemory
   * @description Verifies that an error refreshing an individual user does not prevent subsequent users from being processed.
   */
  it('should continue refreshing subsequent users if an individual user refresh fails', async () => {
    const mockUsers = [{ uid: 'fail-user' }, { uid: 'success-user' }];
    (getAuth as jest.Mock).mockReturnValue({
      listUsers: jest.fn().mockResolvedValue({ users: mockUsers }),
    });

    service.refreshMemory
      .mockRejectedValueOnce(new Error('AI provider timeout'))
      .mockResolvedValueOnce({} as any);

    await expect(cronService.refreshAllUsersHabitMemory()).resolves.not.toThrow();

    expect(service.refreshMemory).toHaveBeenCalledWith('fail-user');
    expect(service.refreshMemory).toHaveBeenCalledWith('success-user');
  });

  /**
   * @testType Unit Test
   * @target HabitMemoryCronService.refreshAllUsersHabitMemory
   * @description Verifies that a failure in listUsers is caught and logged without throwing an unhandled rejection.
   */
  it('should handle global user listing failure gracefully', async () => {
    (getAuth as jest.Mock).mockReturnValue({
      listUsers: jest.fn().mockRejectedValue(new Error('Auth service unavailable')),
    });

    await expect(cronService.refreshAllUsersHabitMemory()).resolves.not.toThrow();
    expect(service.refreshMemory).not.toHaveBeenCalled();
  });
});
