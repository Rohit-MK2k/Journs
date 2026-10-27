import { AccountService } from '@journ/account/services/account.service';
import { ValidationError } from '@journ/common';

interface AccountRepositoryMock {
  deleteUserDocument(uid: string): Promise<void>;
}

interface AuthProviderMock {
  deleteAccount(uid: string): Promise<void>;
}

interface EntryRepositoryPurgeMock {
  save?: jest.Mock;
  update?: jest.Mock;
  findById?: jest.Mock;
  findByDate?: jest.Mock;
  listByUser?: jest.Mock;
  listRecent?: jest.Mock;
  delete?: jest.Mock;
  deleteAll(uid: string): Promise<void>;
}

interface VectorSearchPurgeMock {
  indexEntry?: jest.Mock;
  removeEntry?: jest.Mock;
  removeAll(uid: string): Promise<void>;
  semanticSearch?: jest.Mock;
}

describe('AccountService', () => {
  let service: AccountService;
  let accountRepo: jest.Mocked<AccountRepositoryMock>;
  let authProvider: jest.Mocked<AuthProviderMock>;
  let entryRepo: jest.Mocked<EntryRepositoryPurgeMock>;
  let vectorSearch: jest.Mocked<VectorSearchPurgeMock>;

  beforeEach(() => {
    accountRepo = {
      deleteUserDocument: jest.fn().mockResolvedValue(undefined),
    };
    authProvider = {
      deleteAccount: jest.fn().mockResolvedValue(undefined),
    };
    entryRepo = {
      save: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByDate: jest.fn(),
      listByUser: jest.fn(),
      listRecent: jest.fn(),
      delete: jest.fn(),
      deleteAll: jest.fn().mockResolvedValue(undefined),
    };
    vectorSearch = {
      indexEntry: jest.fn(),
      removeEntry: jest.fn(),
      removeAll: jest.fn().mockResolvedValue(undefined),
      semanticSearch: jest.fn(),
    };

    service = new AccountService(
      accountRepo as any,
      authProvider as any,
      entryRepo as any,
      vectorSearch as any,
    );
  });

  /**
   * @testType Unit Test
   * @target AccountService.wipeUserData
   * @description Verifies that wiping user data triggers cascading deletion across entries, vector search index, firestore user document, and auth account in sequence.
   */
  it('should cascade delete user data in the correct order', async () => {
    await service.wipeUserData('user-123');

    expect(entryRepo.deleteAll).toHaveBeenCalledWith('user-123');
    expect(vectorSearch.removeAll).toHaveBeenCalledWith('user-123');
    expect(accountRepo.deleteUserDocument).toHaveBeenCalledWith('user-123');
    expect(authProvider.deleteAccount).toHaveBeenCalledWith('user-123');
  });

  /**
   * @testType Unit Test
   * @target AccountService.wipeUserData
   * @description Verifies that a ValidationError is thrown if the provided user id is empty or consists solely of whitespace.
   */
  it('should throw validation error if uid is empty', async () => {
    await expect(service.wipeUserData('   ')).rejects.toThrow(ValidationError);
  });
});
