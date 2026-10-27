import {
  AccountRepository,
  AuthProvider,
  EntryRepositoryPurge,
  VectorSearchPurge,
} from '../interfaces';
import { ValidationError } from '@journ/common';

/**
 * Business logic for user account management, including cascading deletion.
 */
export class AccountService {
  constructor(
    private readonly accountRepo: AccountRepository,
    private readonly authProvider: AuthProvider,
    private readonly entryRepo: EntryRepositoryPurge,
    private readonly vectorSearch: VectorSearchPurge,
  ) {}

  /**
   * Permanently wipe all data associated with a user across all systems.
   * Execution order follows critical data-deletion policies to prevent orphaned data.
   */
  async wipeUserData(uid: string): Promise<void> {
    if (!uid || !uid.trim()) {
      throw new ValidationError('uid must not be empty');
    }

    // 1. Recursively delete all entries (which should also cascade to attachments)
    await this.entryRepo.deleteAll(uid);

    // 2. Purge vector search index to prevent data leakage
    await this.vectorSearch.removeAll(uid);

    // 3. Delete the root user document
    await this.accountRepo.deleteUserDocument(uid);

    // 4. Revoke tokens and delete the Auth record (last to ensure DB operations can authenticate if needed)
    await this.authProvider.deleteAccount(uid);
  }
}
