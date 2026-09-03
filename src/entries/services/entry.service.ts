import { Entry, EntrySummary, Attachment, CreateAttachmentInput } from '../domain';
import { EntryRepository, VectorSearchProvider } from '../interfaces';
import { AIProvider } from '../../common/interfaces/ai-provider.interface';

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
      throw new Error('uid must not be empty');
    }
    if (!text.trim()) {
      throw new Error('Entry text must not be empty');
    }

    const today = this.startOfDay(new Date());

    const existing = await this.repo.findByDate(uid, today);
    if (existing) {
      throw new Error('An entry for today already exists');
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
   * Edit the text of an existing entry.
   * Triggers async re-indexing in the vector store.
   */
  async editEntry(uid: string, entryId: string, text: string): Promise<Entry> {
    if (!uid.trim()) {
      throw new Error('uid must not be empty');
    }
    if (!entryId.trim()) {
      throw new Error('entryId must not be empty');
    }
    if (!text.trim()) {
      throw new Error('Entry text must not be empty');
    }

    const existing = await this.repo.findById(uid, entryId);
    if (!existing) {
      throw new Error(`Entry not found: ${entryId}`);
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
   * Build the timeline: all entries for a user, each with an AI summary,
   * sorted newest-first.
   */
  async getTimeline(uid: string): Promise<EntrySummary[]> {
    if (!uid.trim()) {
      throw new Error('uid must not be empty');
    }

    const entries = await this.repo.listByUser(uid);
    if (entries.length === 0) {
      return [];
    }

    const summaries: EntrySummary[] = await Promise.all(
      entries.map(async (entry) => {
        const preview = await this.aiProvider.summarize(entry.text);
        return { id: entry.id, date: entry.date, preview };
      }),
    );

    // Newest first
    return summaries.sort(
      (a, b) => b.date.getTime() - a.date.getTime(),
    );
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
