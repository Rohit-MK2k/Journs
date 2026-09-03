import { Module } from '@nestjs/common';
import { EntriesController } from './presentation/controllers/entries.controller';
import { EntryService } from './services/entry.service';
import { FirestoreEntryRepository } from './infrastructure/repositories/firestore-entry.repository';
import { EntryRepository } from './interfaces/entry-repository.interface';
import { AIProvider } from '../common/interfaces/ai-provider.interface';
import { VectorSearchProvider } from './interfaces/vector-search-provider.interface';

@Module({
  controllers: [EntriesController],
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
  ],
  exports: ['EntryRepository', EntryService],
})
export class EntriesModule {}
