import { AccountRepository } from '../../interfaces';
import { getFirestore } from 'firebase-admin/firestore';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FirestoreAccountRepository implements AccountRepository {
  async deleteUserDocument(uid: string): Promise<void> {
    await getFirestore().collection('users').doc(uid).delete();
  }
}
