import { HealthController } from '../health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
  });

  it('should return ok status on /health', () => {
    const result = controller.checkHealth();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('journ-backend');
    expect(result.timestamp).toBeDefined();
  });

  it('should return running status on /', () => {
    const result = controller.root();
    expect(result.status).toBe('running');
    expect(result.name).toBe('Journ API');
    expect(result.timestamp).toBeDefined();
  });
});
