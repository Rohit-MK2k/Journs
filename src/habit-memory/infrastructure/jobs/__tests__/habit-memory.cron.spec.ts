import { Test, TestingModule } from '@nestjs/testing';
import { HabitMemoryCronService } from '../habit-memory.cron';
import { HabitMemoryService } from '../../../services/habit-memory.service';
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

  it('should refresh memory for all users', async () => {
    const mockUsers = [{ uid: 'user1' }, { uid: 'user2' }];
    (getAuth as jest.Mock).mockReturnValue({
      listUsers: jest.fn().mockResolvedValue({ users: mockUsers }),
    });

    await cronService.refreshAllUsersHabitMemory();

    expect(service.refreshMemory).toHaveBeenCalledWith('user1');
    expect(service.refreshMemory).toHaveBeenCalledWith('user2');
  });
});
