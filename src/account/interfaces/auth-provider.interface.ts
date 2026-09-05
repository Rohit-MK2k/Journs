/** Abstract contract for authentication provider operations. */
export interface AuthProvider {
  /** Revoke tokens and delete the user's authentication record. */
  deleteAccount(uid: string): Promise<void>;
}
