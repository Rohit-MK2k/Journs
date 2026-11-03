import { EntryDraft } from './entry-draft';

/** Response from the AI chatbot for a single message turn. */
export interface ChatResponse {
  message: string;
  /** Present when the AI detects a journal-worthy moment in the conversation. */
  draft?: EntryDraft;
}
