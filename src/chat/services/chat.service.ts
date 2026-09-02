import {
  ChatSession,
  ChatResponse,
  ChatMessageMode,
  EntryDraft,
  DraftSaveTarget,
} from '../domain';
import { Entry, EntryRepository } from '../../entries';
import { HabitMemory, HabitMemoryStore } from '../../habit-memory';
import { AIProvider } from '../../common/interfaces/ai-provider.interface';

const VALID_MODES: ChatMessageMode[] = ['text', 'voice'];

/**
 * Business logic for the AI chatbot: session management, messaging,
 * draft extraction, and confirmed entry saving.
 *
 * The chatbot is primarily a conversational companion. Creating journal
 * entries from chat is secondary and always requires explicit user consent.
 */
export class ChatService {
  /** Active sessions keyed by uid. One active session per user. */
  private readonly sessions = new Map<string, ChatSession>();

  constructor(
    private readonly repo: EntryRepository,
    private readonly habitStore: HabitMemoryStore,
    private readonly aiProvider: AIProvider,
  ) {}

  /**
   * Start a new chat session for a user.
   * Loads habit memory (or defaults) and injects it once at session start.
   */
  async startSession(uid: string): Promise<ChatSession> {
    if (!uid.trim()) {
      throw new Error('uid must not be empty');
    }

    const habitMemory: HabitMemory = (await this.habitStore.get(uid)) ?? {
      uid,
      topics: [],
      frequency: 'unknown',
      tone: 'neutral',
      updatedAt: new Date(),
    };

    const session: ChatSession = {
      id: crypto.randomUUID(),
      uid,
      habitMemory,
      startedAt: new Date(),
    };

    this.sessions.set(uid, session);
    return session;
  }

  /**
   * Send a message in the user's active chat session.
   * Returns the AI response, which may include a draft entry if the AI
   * detected a journal-worthy moment.
   */
  async sendMessage(
    uid: string,
    message: string,
    mode: ChatMessageMode,
  ): Promise<ChatResponse> {
    if (!uid.trim()) {
      throw new Error('uid must not be empty');
    }
    if (!message.trim()) {
      throw new Error('Message must not be empty');
    }
    if (!VALID_MODES.includes(mode)) {
      throw new Error(`Invalid chat mode: ${mode}. Must be 'text' or 'voice'`);
    }

    const session = this.sessions.get(uid);
    if (!session) {
      throw new Error('No active chat session. Call startSession first');
    }

    return this.aiProvider.chat(session, message);
  }

  /**
   * Extract a journal entry draft from a conversation snippet.
   * This is the "show draft to user" step — saving requires separate confirmation.
   */
  async draftEntryFromContext(
    uid: string,
    context: string,
  ): Promise<EntryDraft> {
    if (!uid.trim()) {
      throw new Error('uid must not be empty');
    }
    if (!context.trim()) {
      throw new Error('Context must not be empty');
    }

    return this.aiProvider.extractContext(context);
  }

  /**
   * Save a confirmed draft to the journal.
   * If target is 'today', appends to today's existing entry (or creates new if none).
   * If target is 'new', always creates a new entry.
   *
   * Nothing is saved without the user explicitly calling this method —
   * the AI never silently writes entries.
   */
  async confirmDraftSave(
    uid: string,
    draft: EntryDraft,
    target: DraftSaveTarget,
  ): Promise<Entry> {
    if (!uid.trim()) {
      throw new Error('uid must not be empty');
    }
    if (!draft.text.trim()) {
      throw new Error('Draft text must not be empty');
    }

    const today = this.startOfDay(new Date());

    if (target === 'today') {
      const existing = await this.repo.findByDate(uid, today);
      if (existing) {
        return this.repo.update(uid, existing.id, {
          text: existing.text + '\n\n' + draft.text,
        });
      }
    }

    // target === 'new', or target === 'today' with no existing entry
    return this.repo.save(uid, {
      uid,
      date: today,
      text: draft.text,
      attachments: [],
      vectorIndexed: false,
    });
  }

  /** Normalize a Date to midnight for calendar-day comparison. */
  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }
}
