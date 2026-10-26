import { HealthController } from '../../../src/presentation/controllers/health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(() => {
    controller = new HealthController();
  });

  /**
   * @testType Unit Test
   * @target HealthController.checkHealth
   * @description Verifies that the /health endpoint returns HTTP 200 OK status payload with service identification and timestamp.
   */
  it('should return ok status on /health', () => {
    const result = controller.checkHealth();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('journ-backend');
    expect(result.timestamp).toBeDefined();
  });

  /**
   * @testType Unit Test
   * @target HealthController.root
   * @description Verifies that the root / endpoint returns running status payload with API name and timestamp.
   */
  it('should return running status on /', () => {
    const result = controller.root();
    expect(result.status).toBe('running');
    expect(result.name).toBe('Journ API');
    expect(result.timestamp).toBeDefined();
  });
});
