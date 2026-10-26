import { Test } from '@nestjs/testing';
import { CommonModule } from '../src/common.module';
import { HealthController } from '../src/presentation/controllers/health.controller';
import { GeminiAIProvider } from '../src/infrastructure/providers/gemini-ai.provider';
import { FirebaseStorageProvider } from '../src/infrastructure/providers/firebase-storage.provider';

describe('CommonModule', () => {
  /**
   * @testType Integration Test
   * @target CommonModule
   * @description Verifies that the NestJS DI container compiles CommonModule and successfully resolves all exported controllers, services, and factory providers.
   */
  it('should compile CommonModule and resolve controllers and providers', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CommonModule],
    }).compile();

    expect(moduleRef).toBeDefined();
    expect(moduleRef.get(HealthController)).toBeDefined();
    expect(moduleRef.get('AIProvider')).toBeInstanceOf(GeminiAIProvider);
    expect(moduleRef.get('StorageProvider')).toBeInstanceOf(FirebaseStorageProvider);
    expect(moduleRef.get('GENAI_CLIENT')).toBeDefined();
    expect(moduleRef.get('VERTEX_INDEX_CLIENT')).toBeDefined();
    expect(moduleRef.get('VERTEX_MATCH_CLIENT')).toBeDefined();
  });
});
