import { Module } from '@nestjs/common';
import { EntriesController } from './presentation/controllers/entries.controller';
import { SearchController } from './presentation/controllers/search.controller';
import { EntryService } from './services/entry.service';
import { SemanticSearchService } from './services/semantic-search.service';
import { AttachmentCleanupCronService } from './services/attachment-cleanup-cron.service';
import { FirestoreEntryRepository } from './infrastructure/repositories/firestore-entry.repository';
import { FirestorePendingAttachmentRepository } from './infrastructure/repositories/firestore-pending-attachment.repository';
import { FirestoreCosineVectorSearchProvider } from './infrastructure/providers/firestore-cosine-vector-search.provider';
import { EntryRepository } from './interfaces/entry-repository.interface';
import { PendingAttachmentRepository } from './interfaces/pending-attachment-repository.interface';
import { AIProvider } from '../common/interfaces/ai-provider.interface';
import { VectorSearchProvider } from './interfaces/vector-search-provider.interface';

@Module({
  controllers: [EntriesController, SearchController],
  providers: [
    {
      provide: 'EntryRepository',
      useClass: FirestoreEntryRepository,
    },
    {
      provide: 'PendingAttachmentRepository',
      useClass: FirestorePendingAttachmentRepository,
    },
    {
      provide: 'VectorSearchProvider',
      useClass: FirestoreCosineVectorSearchProvider,
    },
    {
      provide: EntryService,
      useFactory: (
        repo: EntryRepository,
        aiProvider: AIProvider,
        vectorProvider: VectorSearchProvider,
        pendingRepo: PendingAttachmentRepository,
      ) => {
        return new EntryService(repo, aiProvider, vectorProvider, pendingRepo);
      },
      inject: ['EntryRepository', 'AIProvider', 'VectorSearchProvider', 'PendingAttachmentRepository'],
    },
    {
      provide: SemanticSearchService,
      useFactory: (
        vectorProvider: VectorSearchProvider,
        aiProvider: AIProvider,
        entryRepo: EntryRepository,
      ) => {
        return new SemanticSearchService(vectorProvider, aiProvider, entryRepo);
      },
      inject: ['VectorSearchProvider', 'AIProvider', 'EntryRepository'],
    },
    AttachmentCleanupCronService,
  ],
  exports: ['EntryRepository', 'PendingAttachmentRepository', 'VectorSearchProvider', EntryService, SemanticSearchService, AttachmentCleanupCronService],
})
export class EntriesModule {}
