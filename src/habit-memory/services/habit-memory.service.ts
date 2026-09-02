import { HabitMemory } from '../domain';
import { HabitMemoryStore } from '../interfaces';
import { EntryRepository } from '../../entries';
import { AIProvider } from '../../common/interfaces/ai-provider.interface';

const LOOKBACK_DAYS = 30;

/**
 * Business logic for deriving and persisting the user's habit memory.
 *
 * Designed to be invoked by a scheduled job (post-2am), but the service itself
 * has no scheduling awareness — it just does the refresh work when called.
 */
export class HabitMemoryService {
  constructor(
    private readonly repo: EntryRepository,
    private readonly habitStore: HabitMemoryStore,
    private readonly aiProvider: AIProvider,
  ) {}

  /**
   * Refresh habit memory for a user by analyzing their recent journal entries.
   *
   * Looks back 30 days. If no recent entries exist, returns the existing memory
   * (or a default if none). Saves the result to the store before returning.
   */
  async refreshMemory(uid: string): Promise<HabitMemory> {
    if (!uid.trim()) {
      throw new Error('uid must not be empty');
    }

    const since = new Date();
    since.setDate(since.getDate() - LOOKBACK_DAYS);

    const entries = await this.repo.listRecent(uid, since);

    if (entries.length === 0) {
      const existing = await this.habitStore.get(uid);
      return (
        existing ?? {
          uid,
          topics: [],
          frequency: 'none',
          tone: 'neutral',
          updatedAt: new Date(),
        }
      );
    }

    const derived = await this.aiProvider.deriveHabitMemory(entries);

    const memory: HabitMemory = {
      uid,
      topics: derived.topics,
      frequency: derived.frequency,
      tone: derived.tone,
      updatedAt: new Date(),
    };

    await this.habitStore.save(uid, memory);
    return memory;
  }
}
