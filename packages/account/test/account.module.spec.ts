import { Test } from '@nestjs/testing';

jest.mock('firebase-admin/auth', () => ({
  getAuth: jest.fn(),
}));

jest.mock('firebase-admin/firestore', () => ({
  getFirestore: jest.fn(),
}));

import { AccountModule } from '@journ/account/account.module';
import { AccountController } from '@journ/account/presentation/controllers/account.controller';
import { AccountService } from '@journ/account/services/account.service';
import { FirestoreAccountRepository } from '@journ/account/infrastructure/repositories/firestore-account.repository';
import { FirebaseAuthProvider } from '@journ/account/infrastructure/providers/firebase-auth.provider';

describe('AccountModule', () => {
  /**
   * @testType Integration Test
   * @target AccountModule
   * @description Verifies that the NestJS DI container compiles AccountModule and successfully resolves the controller, service, and infrastructure providers.
   */
  it('should compile AccountModule and resolve controllers and providers', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AccountModule],
    })
      .overrideProvider('EntryRepository')
      .useValue({ deleteAll: jest.fn() })
      .overrideProvider('VectorSearchProvider')
      .useValue({ removeAll: jest.fn() })
      .compile();

    expect(moduleRef).toBeDefined();
    expect(moduleRef.get(AccountController)).toBeDefined();
    expect(moduleRef.get(AccountService)).toBeDefined();
    expect(moduleRef.get('AccountRepository')).toBeInstanceOf(FirestoreAccountRepository);
    expect(moduleRef.get('AuthProvider')).toBeInstanceOf(FirebaseAuthProvider);
  });
});
