import { Test } from '@nestjs/testing';
import { CommonModule } from '@journ/common';
import { EntriesModule } from '@journ/entries/entries.module';
import { EntriesController } from '@journ/entries/presentation/controllers/entries.controller';
import { SearchController } from '@journ/entries/presentation/controllers/search.controller';
import { EntryService } from '@journ/entries/services/entry.service';
import { SemanticSearchService } from '@journ/entries/services/semantic-search.service';
import { AttachmentCleanupCronService } from '@journ/entries/services/attachment-cleanup-cron.service';
import { FirestoreEntryRepository } from '@journ/entries/infrastructure/repositories/firestore-entry.repository';
import { FirestorePendingAttachmentRepository } from '@journ/entries/infrastructure/repositories/firestore-pending-attachment.repository';
import { FirestoreCosineVectorSearchProvider } from '@journ/entries/infrastructure/providers/firestore-cosine-vector-search.provider';

describe('EntriesModule', () => {
  /**
   * @testType Integration Test
   * @target EntriesModule
   * @description Verifies that the NestJS DI container compiles EntriesModule and successfully resolves controllers, services, and repository tokens.
   */
  it('should compile EntriesModule and resolve controllers and providers', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CommonModule, EntriesModule],
    })
      .overrideProvider('AIProvider')
      .useValue({ summarize: jest.fn(), extractSemanticChips: jest.fn() })
      .overrideProvider('StorageProvider')
      .useValue({ generateUploadUrl: jest.fn(), deleteFile: jest.fn(), getSignedReadUrl: jest.fn() })
      .overrideProvider('GENAI_CLIENT')
      .useValue({ models: { embedContent: jest.fn() } })
      .overrideProvider('VERTEX_INDEX_CLIENT')
      .useValue({})
      .overrideProvider('VERTEX_MATCH_CLIENT')
      .useValue({})
      .compile();

    expect(moduleRef).toBeDefined();
    expect(moduleRef.get(EntriesController)).toBeDefined();
    expect(moduleRef.get(SearchController)).toBeDefined();
    expect(moduleRef.get(EntryService)).toBeDefined();
    expect(moduleRef.get(SemanticSearchService)).toBeDefined();
    expect(moduleRef.get(AttachmentCleanupCronService)).toBeDefined();
    expect(moduleRef.get('EntryRepository')).toBeInstanceOf(FirestoreEntryRepository);
    expect(moduleRef.get('PendingAttachmentRepository')).toBeInstanceOf(FirestorePendingAttachmentRepository);
    expect(moduleRef.get('VectorSearchProvider')).toBeInstanceOf(FirestoreCosineVectorSearchProvider);
  });
});
