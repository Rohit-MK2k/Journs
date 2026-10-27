/** Abstract contract for account data persistence. */
export interface AccountRepository {
  /** Delete the main user document from the database. */
  deleteUserDocument(uid: string): Promise<void>;
}
