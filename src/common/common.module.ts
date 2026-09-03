import { Module, Global } from '@nestjs/common';
import { GeminiAIProvider } from './infrastructure/providers/gemini-ai.provider';
import { VertexAIVectorSearchProvider } from '../entries/infrastructure/providers/vertex-vector-search.provider';

@Global()
@Module({
  providers: [
    {
      provide: 'AIProvider',
      useClass: GeminiAIProvider,
    },
    {
      provide: 'VectorSearchProvider',
      useClass: VertexAIVectorSearchProvider,
    },
  ],
  exports: ['AIProvider', 'VectorSearchProvider'],
})
export class CommonModule {}
