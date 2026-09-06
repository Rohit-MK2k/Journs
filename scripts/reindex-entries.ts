import { initializeFirebaseAdmin } from '../src/common/infrastructure/firebase/firebase.config';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenAI } from '@google/genai';
import * as path from 'path';

// Load environment variables
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(path.resolve(process.cwd(), '.env'));
  } catch {}
}

const projectId = process.env.GCP_PROJECT_ID ? process.env.GCP_PROJECT_ID : 'journ-app-bb240';
const geminiApiKey = process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY : '';

// 1. Initialize Firebase Admin
initializeFirebaseAdmin();
const db = getFirestore();

// 2. Initialize Gemini Client
const ai = process.env.GCP_PROJECT_ID
  ? new GoogleGenAI({ vertexai: true, project: projectId, location: 'global' })
  : new GoogleGenAI({ vertexai: false, apiKey: geminiApiKey });

async function embedText(text: string): Promise<number[]> {
  const response = await ai.models.embedContent({
    model: 'gemini-embedding-2',
    contents: text,
    config: {
      outputDimensionality: 768,
    },
  });
  return response.embeddings?.[0]?.values || [];
}

async function run() {
  console.log('--- Starting Firestore Cosine Vector Re-Indexing ---');

  const snapshot = await db.collectionGroup('entries').get();
  console.log(`Found ${snapshot.docs.length} total entries in Firestore.`);

  if (snapshot.empty) {
    console.log('No entries found to index.');
    return;
  }

  let indexedCount = 0;
  let skippedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < snapshot.docs.length; i++) {
    const doc = snapshot.docs[i];
    const data = doc.data();
    const entryId = doc.id;
    const text = data.text;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      console.log(`[${i + 1}/${snapshot.docs.length}] Skipping entry ${entryId}: empty text.`);
      skippedCount++;
      continue;
    }

    try {
      const embedding = await embedText(text);
      if (!embedding.length) {
        console.warn(`[${i + 1}/${snapshot.docs.length}] Embedding returned empty for entry ${entryId}.`);
        failedCount++;
        continue;
      }

      await doc.ref.update({
        embedding,
        vectorIndexed: true,
      });

      indexedCount++;
      console.log(`[${i + 1}/${snapshot.docs.length}] Stored ${embedding.length}-dim embedding in Firestore for entry ${entryId}`);
    } catch (err: any) {
      failedCount++;
      console.error(`[${i + 1}/${snapshot.docs.length}] Failed to index entry ${entryId}:`, err.message);
    }
  }

  console.log('\n--- Cosine Vector Re-Indexing Complete ---');
  console.log(`Successfully indexed: ${indexedCount}`);
  console.log(`Skipped (empty text): ${skippedCount}`);
  console.log(`Failed: ${failedCount}`);
}

run().catch((err) => {
  console.error('Fatal error during reindexing:', err);
  process.exit(1);
});
