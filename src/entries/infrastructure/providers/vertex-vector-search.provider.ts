import { VectorSearchProvider } from '../../interfaces/vector-search-provider.interface';
import { Entry } from '../../domain';
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

  async semanticSearch(uid: string, query: string): Promise<Entry[]> {
    try {
      const embedding = await this.embedText(query);
      const endpointName = this.matchClient.indexEndpointPath(this.projectId, this.location, this.endpointId);

      const [response] = await this.matchClient.findNeighbors({
        indexEndpoint: endpointName,
        deployedIndexId: 'journ_entries_index', // Often requires knowing the deployed ID. We'll query first deployed index if possible, or assume a standard name.
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
      const entryIds = neighbors.map(n => n.datapoint?.datapointId).filter(Boolean) as string[];
      
      // In a real flow, we'd fetch the actual Entry objects from Firestore using these IDs.
      // Since VectorSearchProvider returns Entry[], we construct shells or rely on the caller/service to hydrate.
      // We will return shells. The business logic usually only needs IDs to hydrate.
      return entryIds.map(id => ({
        id,
        uid,
        text: '',
        date: new Date(),
        attachments: [],
        vectorIndexed: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
    } catch (e) {
      this.logger.error('Failed to semantic search', e);
      return [];
    }
  }

  private async embedText(text: string): Promise<number[]> {
    const response = await this.ai.models.embedContent({
      model: 'text-embedding-004',
      contents: text,
    });
    return response.embeddings?.[0]?.values || [];
  }
}
