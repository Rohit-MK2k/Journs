import { initializeApp, getApps, cert } from 'firebase-admin/app';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Ensures Firebase Admin SDK is initialized once with available credentials.
 */
export function initializeFirebaseAdmin(): void {
  if (getApps().length > 0) {
    return;
  }

  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json';
  const resolvedPath = path.resolve(process.cwd(), credentialsPath);
  const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || process.env.STORAGE_BUCKET;

  if (fs.existsSync(resolvedPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    const options: any = {
      credential: cert(serviceAccount),
      projectId: process.env.GCP_PROJECT_ID || serviceAccount.project_id,
    };
    if (storageBucket) {
      options.storageBucket = storageBucket;
    }
    initializeApp(options);
  } else {
    // Fall back to default Application Default Credentials (e.g. in Cloud Run / GCP)
    const options: any = {
      projectId: process.env.GCP_PROJECT_ID,
    };
    if (storageBucket) {
      options.storageBucket = storageBucket;
    }
    initializeApp(options);
  }

  try {
    const { getFirestore } = require('firebase-admin/firestore');
    getFirestore().settings({ ignoreUndefinedProperties: true });
  } catch {}
}
