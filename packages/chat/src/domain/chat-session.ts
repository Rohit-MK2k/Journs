import { HabitMemory } from '@journ/habit-memory';

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

/** An active chatbot session, scoped to one user. */
export interface ChatSession {
  id: string;
  uid: string;
  /** Habit memory snapshot injected once at session start. */
  habitMemory: HabitMemory;
  startedAt: Date;
  history?: ChatMessage[];
}
