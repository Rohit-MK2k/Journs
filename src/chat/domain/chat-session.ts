import { HabitMemory } from '../../habit-memory/domain/habit-memory';

/** An active chatbot session, scoped to one user. */
export interface ChatSession {
  id: string;
  uid: string;
  /** Habit memory snapshot injected once at session start. */
  habitMemory: HabitMemory;
  startedAt: Date;
}
