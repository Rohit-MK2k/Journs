import { Module, Global } from '@nestjs/common';
import { GeminiAIProvider } from './infrastructure/providers/gemini-ai.provider';
import { GoogleGenAI } from '@google/genai';
import { v1 } from '@google-cloud/aiplatform';

import { FirebaseStorageProvider } from './infrastructure/providers/firebase-storage.provider';

@Global()
@Module({
  providers: [
    {
      provide: 'GENAI_CLIENT',
      useFactory: () => {
        if (process.env.GCP_PROJECT_ID) {
          return new GoogleGenAI({
            vertexai: true,
            project: process.env.GCP_PROJECT_ID,
            location: process.env.GENAI_LOCATION || 'global',
          });
        }
        return new GoogleGenAI({ 
          vertexai: false,
          apiKey: process.env.GEMINI_API_KEY || 'dummy-dev-key-for-booting'
        });
      },
    },
    {
      provide: 'VERTEX_INDEX_CLIENT',
      useFactory: () => {
        const location = process.env.GCP_REGION || 'us-central1';
        return new v1.IndexServiceClient({
          apiEndpoint: `${location}-aiplatform.googleapis.com`,
        });
      },
    },
    {
      provide: 'VERTEX_MATCH_CLIENT',
      useFactory: () => {
        const location = process.env.GCP_REGION || 'us-central1';
        const publicDomain = process.env.VERTEX_PUBLIC_DOMAIN || '';
        return new v1.MatchServiceClient({
          apiEndpoint: publicDomain || `${location}-aiplatform.googleapis.com`,
        });
      },
    },
    {
      provide: 'AIProvider',
      useClass: GeminiAIProvider,
    },
    {
      provide: 'StorageProvider',
      useClass: FirebaseStorageProvider,
    },
  ],
  exports: ['AIProvider', 'GENAI_CLIENT', 'VERTEX_INDEX_CLIENT', 'VERTEX_MATCH_CLIENT', 'StorageProvider'],
})
export class CommonModule {}
