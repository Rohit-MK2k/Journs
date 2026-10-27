import { Module } from '@nestjs/common';
import { AccountController } from './presentation/controllers/account.controller';
import { AccountService } from './services/account.service';
import { FirestoreAccountRepository } from './infrastructure/repositories/firestore-account.repository';
import { FirebaseAuthProvider } from './infrastructure/providers/firebase-auth.provider';

@Module({
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
      useFactory: (repo, auth, entryRepo, vectorSearch) => {
        return new AccountService(repo, auth, entryRepo, vectorSearch);
      },
      inject: [
        'AccountRepository',
        'AuthProvider',
        { token: 'EntryRepository', optional: true },
        { token: 'VectorSearchProvider', optional: true },
      ],
    },
  ],
  exports: [AccountService, 'AccountRepository', 'AuthProvider'],
})
export class AccountModule {}
