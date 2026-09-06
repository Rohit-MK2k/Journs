import { Controller, Get } from '@nestjs/common';
import { Public } from '../../decorators/public.decorator';

@Controller()
export class HealthController {
  @Public()
  @Get('health')
  checkHealth() {
    return {
      status: 'ok',
      service: 'journ-backend',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get()
  root() {
    return {
      name: 'Journ API',
      status: 'running',
      timestamp: new Date().toISOString(),
    };
  }
}
