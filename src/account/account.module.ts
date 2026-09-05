import { Module } from '@nestjs/common';
import { AccountController } from './presentation/controllers/account.controller';
import { AccountService } from './services/account.service';
import { FirestoreAccountRepository } from './infrastructure/repositories/firestore-account.repository';
import { FirebaseAuthProvider } from './infrastructure/providers/firebase-auth.provider';
import { EntriesModule } from '../entries/entries.module';

@Module({
  imports: [EntriesModule],
  controllers: [AccountController],
  providers: [
    {
      provide: 'AccountRepository',
      useClass: FirestoreAccountRepository,
    },
    {
      provide: 'AuthProvider',
      useClass: FirebaseAuthProvider,
    },
    {
      provide: AccountService,
      useFactory: (repo, auth, entryService, vectorSearch) => {
        return new AccountService(repo, auth, entryService, vectorSearch);
      },
      inject: ['AccountRepository', 'AuthProvider', 'EntryRepository', 'VectorSearchProvider'],
    }
  ],
})
export class AccountModule {}
