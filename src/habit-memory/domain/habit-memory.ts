/** Detailed stylistic and temporal characteristics of how the user writes. */
export interface WritingHabits {
  /** How entries are arranged (e.g., 'bullet points', 'structured paragraphs', 'stream of consciousness'). */
  structure: string;
  /** Entry length and depth (e.g., 'concise check-ins (~100-200 words)', 'long-form reflections'). */
  depth: string;
  /** Typical time of day user writes (e.g., 'late night (11 PM - 1 AM)', 'morning reflections'). */
  timing: string;
  /** Language style and voice (e.g., 'casual and colloquial', 'analytical and introspective'). */
  vocabulary: string;
}

/** Persisted AI-derived memory of a user's journaling habits. */
export interface HabitMemory {
  uid: string;
  /** Recurring topics the user writes about. */
  topics: string[];
  /** How often the user journals (e.g., 'daily', 'weekly', 'none'). */
  frequency: string;
  /** Overall writing tone (e.g., 'reflective', 'neutral', 'anxious'). */
  tone: string;
  /** How the user journals (structure, depth, timing, vocabulary). */
  writingHabits?: WritingHabits;
  updatedAt: Date;
}
