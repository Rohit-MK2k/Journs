import { VectorSearchProvider } from '../../interfaces/vector-search-provider.interface';
import { Entry, VectorSearchResult } from '../../domain';
import { GoogleGenAI } from '@google/genai';
import { v1 } from '@google-cloud/aiplatform';
import { Logger, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class VertexAIVectorSearchProvider implements VectorSearchProvider {
  private readonly logger = new Logger(VertexAIVectorSearchProvider.name);

  private readonly projectId = process.env.GCP_PROJECT_ID!;
  private readonly location = process.env.GCP_REGION || 'us-central1';
  private readonly indexId = process.env.VERTEX_INDEX_ID!;
  private readonly endpointId = process.env.VERTEX_INDEX_ENDPOINT_ID!;

  constructor(
    @Inject('GENAI_CLIENT') private readonly ai: GoogleGenAI,
    @Inject('VERTEX_INDEX_CLIENT') private readonly indexClient: v1.IndexServiceClient,
    @Inject('VERTEX_MATCH_CLIENT') private readonly matchClient: v1.MatchServiceClient,
  ) {}

  async indexEntry(uid: string, entry: Entry): Promise<void> {
    try {
      const embedding = await this.embedText(entry.text);
      if (!embedding.length) {
        this.logger.warn(`Skipping vector indexing for entry ${entry.id}: embedding generation returned empty`);
        return;
      }
      
      const indexName = this.indexClient.indexPath(this.projectId, this.location, this.indexId);

      await this.indexClient.upsertDatapoints({
        index: indexName,
        datapoints: [
          {
            datapointId: entry.id,
            featureVector: embedding,
            restricts: [
              {
                namespace: 'uid',
                allowList: [uid],
              },
            ],
          },
        ],
      });
      this.logger.log(`Indexed entry ${entry.id} for user ${uid}`);
    } catch (e) {
      this.logger.error(`Failed to index entry ${entry.id}`, e);
      throw e;
    }
  }

  async removeEntry(uid: string, entryId: string): Promise<void> {
    try {
      const indexName = this.indexClient.indexPath(this.projectId, this.location, this.indexId);
      
      await this.indexClient.removeDatapoints({
        index: indexName,
        datapointIds: [entryId],
      });
      this.logger.log(`Removed entry ${entryId} from index`);
    } catch (e) {
      this.logger.error(`Failed to remove entry ${entryId}`, e);
      throw e;
    }
  }

  async removeAll(uid: string): Promise<void> {
    try {
      this.logger.log(`Removing all vector embeddings for user ${uid}`);
      // Implementation depends on GCP setup; usually requires querying by namespace and deleting
    } catch (e) {
      this.logger.error(`Failed to remove all entries for user ${uid} from vector search`, e);
    }
  }

  async semanticSearch(uid: string, query: string): Promise<VectorSearchResult[]> {
    try {
      const embedding = await this.embedText(query);
      if (!embedding.length) {
        this.logger.warn('Skipping semantic search: embedding generation returned empty');
        return [];
      }
      const endpointName = this.matchClient.indexEndpointPath(this.projectId, this.location, this.endpointId);

      const [response] = await this.matchClient.findNeighbors({
        indexEndpoint: endpointName,
        deployedIndexId: 'journ_entries_index',
        queries: [
          {
            datapoint: {
              datapointId: '',
              featureVector: embedding,
              restricts: [
                {
                  namespace: 'uid',
                  allowList: [uid],
                },
              ],
            },
            neighborCount: 5,
          },
        ],
      });

      const neighbors = response.nearestNeighbors?.[0]?.neighbors || [];
      
      return neighbors.map(n => {
        const id = n.datapoint?.datapointId || '';
        const distance = n.distance || 0;
        
        return {
          distance,
          entry: {
            id,
            uid,
            text: '',
            date: new Date(),
            attachments: [],
            vectorIndexed: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          }
        };
      }).filter(n => n.entry.id !== '');
    } catch (e) {
      this.logger.error('Failed to semantic search', e);
      return [];
    }
  }

  private async embedText(text: string): Promise<number[]> {
    try {
      const response = await this.ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: text,
      });
      return response.embeddings?.[0]?.values || [];
    } catch (e) {
      this.logger.error('Failed to generate embedding with gemini-embedding-2', e);
      return [];
    }
  }
}
