import { Entry, EntrySummary, Attachment, CreateAttachmentInput } from '../domain';
import { EntryRepository, VectorSearchProvider } from '../interfaces';
import { AIProvider } from '../../common/interfaces/ai-provider.interface';
import { ValidationError, ConflictError, NotFoundError } from '../../common/errors';

/**
 * Business logic for journal entry creation, editing, and timeline retrieval.
 *
 * Depends on abstractions only — never on concrete DB or AI implementations.
 */
export class EntryService {
  constructor(
    private readonly repo: EntryRepository,
    private readonly aiProvider: AIProvider,
    private readonly vectorSearch: VectorSearchProvider,
  ) {}

  /**
   * Create a new journal entry for today.
   * Enforces one entry per calendar day. Triggers async vector indexing.
   */
  async createEntry(
    uid: string,
    text: string,
    attachments: CreateAttachmentInput[] = [],
  ): Promise<Entry> {
    if (!uid.trim()) {
      throw new ValidationError('uid must not be empty');
    }
    if (!text.trim()) {
      throw new ValidationError('Entry text must not be empty');
    }

    const today = this.startOfDay(new Date());

    const existing = await this.repo.findByDate(uid, today);
    if (existing) {
      throw new ConflictError('An entry for today already exists');
    }

    const saved = await this.repo.save(uid, {
      uid,
      date: today,
      text,
      attachments,
      vectorIndexed: false,
    });

    // Fire-and-forget: index in vector search, then mark indexed.
    // Errors are swallowed — indexing failure must not break the write path.
    this.indexEntryAsync(uid, saved);

    return saved;
  }

  /**
   * Autosave: Upserts the journal entry for today.
   * Tolerates debounced rapid writes.
   */
  async autosaveEntry(uid: string, text: string): Promise<Entry> {
    const today = this.startOfDay(new Date());
    const existing = await this.repo.findByDate(uid, today);

    if (existing) {
      return this.editEntry(uid, existing.id, text);
    } else {
      return this.createEntry(uid, text, []);
    }
  }

  /**
   * Edit the text of an existing entry.
   * Triggers async re-indexing in the vector store.
   */
  async editEntry(uid: string, entryId: string, text: string): Promise<Entry> {
    if (!uid.trim()) {
      throw new ValidationError('uid must not be empty');
    }
    if (!entryId.trim()) {
      throw new ValidationError('entryId must not be empty');
    }
    if (!text.trim()) {
      throw new ValidationError('Entry text must not be empty');
    }

    const existing = await this.repo.findById(uid, entryId);
    if (!existing) {
      throw new NotFoundError(`Entry not found: ${entryId}`);
    }

    const updated = await this.repo.update(uid, entryId, {
      text,
      vectorIndexed: false,
    });

    // Fire-and-forget re-indexing
    this.indexEntryAsync(uid, updated);

    return updated;
  }

  /**
   * Autosave an entry's text.
   * Utilizes a last-write-wins concurrency strategy based on client timestamp.
   * If the stored entry has a newer client timestamp, the autosave is rejected.
   */
  async autosave(uid: string, entryId: string, text: string, clientTimestamp: Date): Promise<Entry> {
    if (!uid.trim()) {
      throw new ValidationError('uid must not be empty');
    }
    if (!entryId.trim()) {
      throw new ValidationError('entryId must not be empty');
    }

    const existing = await this.repo.findById(uid, entryId);
    if (!existing) {
      throw new NotFoundError(`Entry not found: ${entryId}`);
    }

    // Simple optimistic concurrency control (last-write-wins)
    if (existing.lastAutosaveAt && clientTimestamp < existing.lastAutosaveAt) {
      throw new ConflictError('A newer version of this entry has already been autosaved.');
    }

    return this.repo.update(uid, entryId, {
      text,
      lastAutosaveAt: clientTimestamp,
      vectorIndexed: false, // Invalidate search index so it can be re-indexed later
    });
  }
  /**
   * Build the timeline: all entries for a user, each with an AI summary,
   * sorted newest-first.
   */
  async getTimeline(uid: string): Promise<EntrySummary[]> {
    if (!uid.trim()) {
      throw new ValidationError('uid must not be empty');
    }

    const entries = await this.repo.listByUser(uid);
    if (entries.length === 0) {
      return [];
    }

    const summaries: EntrySummary[] = await Promise.all(
      entries.map(async (entry) => {
        const preview = await this.aiProvider.summarize(entry.text);
        const wordCount = entry.text.split(/\s+/).filter(w => w.length > 0).length;
        return { 
          id: entry.id, 
          date: entry.date, 
          preview,
          wordCount,
          hasAttachments: entry.attachments.length > 0
        };
      }),
    );

    // Newest first
    return summaries.sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
  }

  /**
   * Generates a 1-line gist of the entry asynchronously and stores it.
   * Useful to offload expensive generation from rapid autosaves.
   */
  async generateAndSaveSummary(uid: string, entryId: string): Promise<void> {
    const entry = await this.repo.findById(uid, entryId);
    if (!entry || entry.uid !== uid) {
      throw new NotFoundError(`Entry not found: ${entryId}`);
    }

    if (!entry.text || entry.text.length < 10) {
      return;
    }

    const summary = await this.aiProvider.generateSummary(entry.text);
    await this.repo.update(uid, entryId, { summary });
  }

  /**
   * Adds a new attachment to the given entry.
   */
  async addAttachment(uid: string, entryId: string, attachmentInput: CreateAttachmentInput): Promise<Attachment> {
    const entry = await this.repo.findById(uid, entryId);
    if (!entry || entry.uid !== uid) {
      throw new NotFoundError(`Entry not found: ${entryId}`);
    }

    // Generate pseudo-random UUID for the attachment
    const attachmentId = Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    
    const newAttachment = {
      ...attachmentInput,
      id: attachmentId,
      entryId,
      createdAt: new Date(),
    } as Attachment;

    const attachments = [...(entry.attachments || []), newAttachment];
    
    await this.repo.update(uid, entryId, { attachments });
    return newAttachment;
  }

  /**
   * Removes an attachment by ID from the given entry.
   */
  async removeAttachment(uid: string, entryId: string, attachmentId: string): Promise<void> {
    const entry = await this.repo.findById(uid, entryId);
    if (!entry || entry.uid !== uid) {
      throw new NotFoundError(`Entry not found: ${entryId}`);
    }

    const initialCount = entry.attachments.length;
    const attachments = entry.attachments.filter(a => a.id !== attachmentId);

    if (attachments.length !== initialCount) {
      await this.repo.update(uid, entryId, { attachments });
    }
  }

  /** Normalize a Date to midnight (start of day) for calendar-day comparison. */
  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Fire-and-forget vector indexing. Catches all errors silently —
   * indexing is best-effort and must not break the user-facing write flow.
   */
  private indexEntryAsync(uid: string, entry: Entry): void {
    this.vectorSearch
      .indexEntry(uid, entry)
      .then(() => this.repo.update(uid, entry.id, { vectorIndexed: true }))
      .catch(() => {
        // Intentionally swallowed. Vector indexing is async and non-critical.
        // A background reconciliation job can re-index entries with vectorIndexed=false.
      });
  }
}

