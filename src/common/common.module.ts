import { Module, Global } from '@nestjs/common';
import { GeminiAIProvider } from './infrastructure/providers/gemini-ai.provider';
import { VertexAIVectorSearchProvider } from '../entries/infrastructure/providers/vertex-vector-search.provider';
import { GoogleGenAI } from '@google/genai';
import { v1 } from '@google-cloud/aiplatform';

@Global()
@Module({
  providers: [
    {
      provide: 'GENAI_CLIENT',
      useFactory: () => new GoogleGenAI({ vertexai: !!process.env.GCP_PROJECT_ID }),
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
      provide: 'VectorSearchProvider',
      useClass: VertexAIVectorSearchProvider,
    },
  ],
  exports: ['AIProvider', 'VectorSearchProvider', 'GENAI_CLIENT', 'VERTEX_INDEX_CLIENT', 'VERTEX_MATCH_CLIENT'],
})
export class CommonModule {}
