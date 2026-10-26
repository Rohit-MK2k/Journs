export interface IChatMessage {
  role: 'user' | 'assistant' | 'model';
  content: string;
  timestamp?: Date;
}

export interface IChatSession {
  id: string;
  uid: string;
  startedAt: Date;
  habitMemory?: IHabitMemory;
  messages?: IChatMessage[];
}

export interface IChatResponse {
  message: string;
  extractedDraft?: string;
}

export interface IEntryDraft {
  text: string;
  title?: string;
  tags?: string[];
}

export interface IHabitWritingStyle {
  structure?: string;
  depth?: string;
  timing?: string;
  vocabulary?: string;
}

export interface IHabitMemory {
  uid: string;
  updatedAt: Date;
  topics: string[];
  frequency: string;
  tone: string;
  writingHabits?: IHabitWritingStyle;
}

export interface IEntry {
  id?: string;
  uid?: string;
  text: string;
  title?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IChatTurnResponse {
  replyText: string;
  extractedDraft?: string;
}
