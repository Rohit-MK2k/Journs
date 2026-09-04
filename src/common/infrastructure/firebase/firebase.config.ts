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

  if (fs.existsSync(resolvedPath)) {
    const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    initializeApp({
      credential: cert(serviceAccount),
      projectId: process.env.GCP_PROJECT_ID || serviceAccount.project_id,
    });
  } else {
    // Fall back to default Application Default Credentials (e.g. in Cloud Run / GCP)
    initializeApp({
      projectId: process.env.GCP_PROJECT_ID,
    });
  }
}
