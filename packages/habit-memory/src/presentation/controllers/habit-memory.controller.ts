import { Controller, Get, Req } from '@nestjs/common';
import { HabitMemoryService } from '../../services/habit-memory.service';

@Controller('habit-memory')
export class HabitMemoryController {
  constructor(private readonly habitMemoryService: HabitMemoryService) {}

  @Get()
  async getHabitMemory(@Req() req: any) {
    const memory = await this.habitMemoryService.getMemory(req.user.uid);
    if (!memory) {
      return {
        uid: req.user.uid,
        topics: [],
        frequency: 'none',
        tone: 'neutral',
        updatedAt: null,
      };
    }
    return memory;
  }
}
