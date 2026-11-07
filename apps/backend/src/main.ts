import 'reflect-metadata';
import { initializeFirebaseAdmin } from '@journ/common';
import { bootstrap } from './bootstrap';

export function loadEnvironment(): void {
  if (typeof process.loadEnvFile === 'function') {
    try {
      process.loadEnvFile();
    } catch {
      // Silently proceed if .env is missing
    }
  }
}

export async function run(): Promise<void> {
  loadEnvironment();
  initializeFirebaseAdmin();
  await bootstrap();
}

if (require.main === module) {
  run().catch((err) => {
    console.error('Failed to start application:', err);
    process.exit(1);
  });
}
