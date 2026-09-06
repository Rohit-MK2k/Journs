import * as path from 'path';
import * as readline from 'readline';
import { initializeFirebaseAdmin } from '../src/common/infrastructure/firebase/firebase.config';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { GoogleGenAI } from '@google/genai';
import { HabitMemoryService } from '../src/habit-memory/services/habit-memory.service';
import { FirestoreEntryRepository } from '../src/entries/infrastructure/repositories/firestore-entry.repository';
import { FirestoreHabitMemoryStore } from '../src/habit-memory/infrastructure/repositories/firestore-habit-memory.store';
import { GeminiAIProvider } from '../src/common/infrastructure/providers/gemini-ai.provider';

// Load environment variables
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(path.resolve(process.cwd(), '.env'));
  } catch {}
}

initializeFirebaseAdmin();

function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans.trim());
  }));
}

async function run() {
  console.log('=== Journ Force Habit Generation ===\n');

  const auth = getAuth();
  const db = getFirestore();

  // 1. Fetch available users
  console.log('Fetching users from Firebase Auth and Firestore...');
  const userMap = new Map<string, { uid: string; email?: string; displayName?: string }>();

  try {
    const listResult = await auth.listUsers(1000);
    for (const u of listResult.users) {
      userMap.set(u.uid, { uid: u.uid, email: u.email, displayName: u.displayName });
    }
  } catch (err: any) {
    console.warn('Could not list auth users:', err.message);
  }

  try {
    const entriesSnap = await db.collectionGroup('entries').select('uid').get();
    for (const doc of entriesSnap.docs) {
      const uid = doc.data().uid;
      if (uid && !userMap.has(uid)) {
        userMap.set(uid, { uid });
      }
    }
  } catch (err: any) {
    // collectionGroup scan fallback if no index
  }

  const usersList = Array.from(userMap.values());

  if (usersList.length === 0) {
    console.error('No users found in Firebase Auth or Firestore.');
    process.exit(1);
  }

  let selectedUid = process.argv[2]?.trim();

  if (!selectedUid) {
    console.log('\nAvailable Users:');
    usersList.forEach((u, idx) => {
      const identifier = u.displayName || u.email || 'Anonymous';
      const details = u.email ? ` (${u.email})` : '';
      console.log(`  [${idx + 1}] ${identifier}${details} - UID: ${u.uid}`);
    });

    console.log('');
    const input = await askQuestion(`Select user number (1-${usersList.length}) or enter UID: `);

    if (!input || input.toLowerCase() === 'q') {
      console.log('Aborted.');
      process.exit(0);
    }

    const index = parseInt(input, 10);
    if (!isNaN(index) && index >= 1 && index <= usersList.length) {
      selectedUid = usersList[index - 1].uid;
    } else if (userMap.has(input)) {
      selectedUid = input;
    } else if (input.length > 5) {
      selectedUid = input;
    } else {
      console.error('Invalid selection.');
      process.exit(1);
    }
  }

  console.log(`\nTarget User: ${selectedUid}`);

  // 2. Initialize Gemini Client & Service
  const aiClient = process.env.GCP_PROJECT_ID
    ? new GoogleGenAI({
        vertexai: true,
        project: process.env.GCP_PROJECT_ID,
        location: process.env.GENAI_LOCATION || 'global',
      })
    : new GoogleGenAI({
        vertexai: false,
        apiKey: process.env.GEMINI_API_KEY || '',
      });

  const aiProvider = new GeminiAIProvider(aiClient);
  const entryRepo = new FirestoreEntryRepository();
  const habitStore = new FirestoreHabitMemoryStore();
  const habitService = new HabitMemoryService(entryRepo, habitStore, aiProvider);

  // Check entries for user
  const recentSince = new Date();
  recentSince.setDate(recentSince.getDate() - 30);
  const recentEntries = await entryRepo.listRecent(selectedUid, recentSince);
  console.log(`Found ${recentEntries.length} entries within the last 30 days.`);

  if (recentEntries.length === 0) {
    const allEntries = await entryRepo.listByUser(selectedUid);
    if (allEntries.length > 0) {
      console.log(`Note: User has ${allEntries.length} entries older than 30 days. Standard lookback is 30 days.`);
    }
  }

  console.log('Deriving habit memory with Gemini AI...');
  const memory = await habitService.refreshMemory(selectedUid);

  console.log('\n=== Habit Memory Successfully Generated ===');
  console.log(`UID:           ${memory.uid}`);
  console.log(`Detected Tone: ${memory.tone}`);
  console.log(`Cadence:       ${memory.frequency}`);
  console.log(`Topics:        ${memory.topics.length ? memory.topics.join(', ') : '(None)'}`);
  if (memory.writingHabits) {
    console.log('\n--- Writing Habits & Style ---');
    console.log(`Structure:     ${memory.writingHabits.structure}`);
    console.log(`Typical Depth: ${memory.writingHabits.depth}`);
    console.log(`Timing:        ${memory.writingHabits.timing}`);
    console.log(`Vocabulary:    ${memory.writingHabits.vocabulary}`);
  }
  console.log(`\nUpdated At:    ${memory.updatedAt.toISOString()}`);
  console.log(`Persisted to Firestore at: users/${selectedUid}/habitMemory/default`);
}

run().catch((err) => {
  console.error('Fatal error during habit generation:', err);
  process.exit(1);
});
