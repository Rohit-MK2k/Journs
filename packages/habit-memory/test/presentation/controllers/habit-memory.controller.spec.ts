import { HabitMemoryController } from '@journ/habit-memory/presentation/controllers/habit-memory.controller';
import { HabitMemoryService } from '@journ/habit-memory/services/habit-memory.service';

describe('HabitMemoryController', () => {
  let controller: HabitMemoryController;
  let service: jest.Mocked<Partial<HabitMemoryService>>;

  beforeEach(() => {
    service = {
      getMemory: jest.fn(),
    };
    controller = new HabitMemoryController(service as HabitMemoryService);
  });

  /**
   * @testType Unit Test
   * @target HabitMemoryController.getHabitMemory
   * @description Verifies that GET /habit-memory returns the user's habit memory profile when one exists.
   */
  it('should return habit memory when found', async () => {
    const memory = {
      uid: 'user-1',
      topics: ['coding', 'health'],
      frequency: 'daily',
      tone: 'reflective',
      updatedAt: new Date('2026-09-01'),
    };
    (service.getMemory as jest.Mock).mockResolvedValue(memory);

    const req = { user: { uid: 'user-1' } };
    const result = await controller.getHabitMemory(req);

    expect(service.getMemory).toHaveBeenCalledWith('user-1');
    expect(result).toEqual(memory);
  });

  /**
   * @testType Unit Test
   * @target HabitMemoryController.getHabitMemory
   * @description Verifies that GET /habit-memory returns a default empty habit memory structure when none exists.
   */
  it('should return default empty habit memory structure when none exists', async () => {
    (service.getMemory as jest.Mock).mockResolvedValue(null);

    const req = { user: { uid: 'user-2' } };
    const result = await controller.getHabitMemory(req);

    expect(service.getMemory).toHaveBeenCalledWith('user-2');
    expect(result).toEqual({
      uid: 'user-2',
      topics: [],
      frequency: 'none',
      tone: 'neutral',
      updatedAt: null,
    });
  });
});
