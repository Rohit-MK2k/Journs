import { Module } from '@nestjs/common';
import { EntriesController } from './presentation/controllers/entries.controller';
import { SearchController } from './presentation/controllers/search.controller';
import { EntryService } from './services/entry.service';
import { SemanticSearchService } from './services/semantic-search.service';
import { FirestoreEntryRepository } from './infrastructure/repositories/firestore-entry.repository';
import { EntryRepository } from './interfaces/entry-repository.interface';
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
      provide: EntryService,
      useFactory: (
        repo: EntryRepository,
        aiProvider: AIProvider,
        vectorProvider: VectorSearchProvider,
      ) => {
        return new EntryService(repo, aiProvider, vectorProvider);
      },
      inject: ['EntryRepository', 'AIProvider', 'VectorSearchProvider'],
    },
    {
      provide: SemanticSearchService,
      useFactory: (
        vectorProvider: VectorSearchProvider,
        aiProvider: AIProvider,
      ) => {
        return new SemanticSearchService(vectorProvider, aiProvider);
      },
      inject: ['VectorSearchProvider', 'AIProvider'],
    },
  ],
  exports: ['EntryRepository', EntryService, SemanticSearchService],
})
export class EntriesModule {}
