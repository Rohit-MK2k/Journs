/** Persisted AI-derived memory of a user's journaling habits. */
export interface HabitMemory {
  uid: string;
  /** Recurring topics the user writes about. */
  topics: string[];
  /** How often the user journals (e.g., 'daily', 'weekly', 'none'). */
  frequency: string;
  /** Overall writing tone (e.g., 'reflective', 'neutral', 'anxious'). */
  tone: string;
  updatedAt: Date;
}
