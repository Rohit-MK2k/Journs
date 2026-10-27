import { AuthProvider } from '../../interfaces';
import { getAuth } from 'firebase-admin/auth';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FirebaseAuthProvider implements AuthProvider {
  async deleteAccount(uid: string): Promise<void> {
    await getAuth().deleteUser(uid);
  }
}
