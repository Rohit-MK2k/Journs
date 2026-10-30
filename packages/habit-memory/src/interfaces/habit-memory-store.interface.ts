import { HabitMemory } from '../domain/habit-memory';

/** Abstract contract for habit memory persistence. */
export interface HabitMemoryStore {
  /** Retrieve the habit memory for a user. Returns null if none exists. */
  get(uid: string): Promise<HabitMemory | null>;

  /** Persist or overwrite the habit memory for a user. */
  save(uid: string, memory: HabitMemory): Promise<void>;
}
