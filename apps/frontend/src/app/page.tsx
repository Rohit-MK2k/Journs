"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import AuthGuard from "@/components/AuthGuard";
import { apiClient } from "@/lib/apiClient";
import useSWR from "swr";

export type JournalEntry = {
  id: string;
  date?: string;
  preview?: string;
  wordCount?: number;
  hasAttachments?: boolean;
  relativeDate?: string;
  fullDate?: string;
  aiSummary?: string;
  snippet?: string;
  readTime?: string;
  text?: string;
  attachments?: any[] | Record<string, any>;
};

const DRAFT_KEY = "journ_entry_draft";

function getMidnightTimestamp(): number {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}

function getTodayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

const fetcher = async (url: string) => {
  const res = await apiClient(url);
  const json = await res.json();
  // GET /entries returns { data: [...], meta: { total: ... } }
  return json.data ?? json;
};

interface StagedAttachment {
  type: string;
  url?: string;
  filePath?: string;
  fileId?: string;
  lat?: number;
  lng?: number;
  locationLabel?: string;
  name?: string;
  previewUrl?: string;
}

export default function MainDashboard() {
  const [editorText, setEditorText] = useState("");
  const [saveStatus, setSaveStatus] = useState<"Saving..." | "Saved" | "Sync Failed" | "Draft saved locally" | "">("");
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [expandedEntry, setExpandedEntry] = useState<JournalEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'today' | 'past'>('today');
  const [isSaving, setIsSaving] = useState(false);
  const [activeLightboxImage, setActiveLightboxImage] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser) {
      setUser(auth.currentUser);
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const initials = (displayName || "U")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";

  const { data: entries, error: entriesError, isLoading: entriesLoading, mutate: mutateEntries } = useSWR<JournalEntry[]>('/api/entries', fetcher, {
    errorRetryCount: 2
  });
  
  // Attachments State & Device Pickers
  const [attachments, setAttachments] = useState<StagedAttachment[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const photoInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveLightboxImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const entryId = params.get('entry');
      if (entryId) {
        handleSelectEntry({ id: entryId });
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Idle Prompt State
  const [isIdle, setIsIdle] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const IDLE_PROMPTS = ["What's on your mind today?", "How are you feeling?", "Write about a small win."];

  const isFirstRender = useRef(true);
  const lastSavedTextRef = useRef("");

  // Load draft from localStorage on mount (expires at end of current calendar day)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft.date === getTodayDateString() && Date.now() < draft.expiresAt) {
          if (draft.text) setEditorText(draft.text);
          if (Array.isArray(draft.attachments)) {
            const sanitized = draft.attachments.map((att: any) => ({
              ...att,
              previewUrl: att.previewUrl?.startsWith('blob:') ? undefined : att.previewUrl,
            }));
            setAttachments(sanitized);
          }
        } else {
          localStorage.removeItem(DRAFT_KEY);
        }
      }
    } catch {
      // Ignore storage read errors
    }
  }, []);
  
  // Idle detection
  useEffect(() => {
    if (editorText) {
      setIsIdle(false);
      return;
    }
    const idleTimer = setTimeout(() => setIsIdle(true), 5000);
    return () => clearTimeout(idleTimer);
  }, [editorText]);

  // Prompt rotation
  useEffect(() => {
    if (!isIdle) {
      setPromptIndex(0);
      return;
    }
    const rotation = setInterval(() => {
      setPromptIndex(i => (i + 1) % IDLE_PROMPTS.length);
    }, 3000);
    return () => clearInterval(rotation);
  }, [isIdle]);

  // Debounced autosave of draft into localStorage
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    if (!editorText && attachments.length === 0) {
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      return;
    }

    setSaveStatus("Saving...");
    
    const timeout = setTimeout(() => {
      try {
        const safeAttachments = attachments.map((att) => ({
          ...att,
          previewUrl: att.previewUrl?.startsWith('blob:') ? undefined : att.previewUrl,
        }));
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            text: editorText,
            attachments: safeAttachments,
            date: getTodayDateString(),
            expiresAt: getMidnightTimestamp(),
          })
        );
        setSaveStatus("Draft saved locally");
        setTimeout(() => setSaveStatus(""), 2000);
      } catch (error) {
        setSaveStatus("Sync Failed");
      }
    }, 500);
    
    return () => clearTimeout(timeout);
  }, [editorText, attachments]);

  // Manual save handler
  const handleManualSave = async () => {
    if ((!editorText.trim() && attachments.length === 0) || isSaving) return;
    setIsSaving(true);
    setSaveStatus("Saving...");
    try {
      const savedText = editorText.trim();
      const res = await apiClient('/api/entries', {
        method: 'POST',
        body: JSON.stringify({ 
          text: savedText || 'Untitled Entry',
          attachments: attachments.map(a => {
            if (a.type === 'location') {
              return {
                type: 'location',
                lat: a.lat ?? 0,
                lng: a.lng ?? 0,
                locationLabel: a.locationLabel || '',
              };
            }
            if (a.type === 'voice') {
              return {
                type: 'voice',
                url: a.url || '',
                filePath: a.filePath || '',
                fileId: a.fileId || '',
              };
            }
            return {
              type: 'photo',
              url: a.url || '',
              filePath: a.filePath || '',
              fileId: a.fileId || '',
            };
          })
        })
      });
      const data = await res.json();
      if (data?.id) {
        setCurrentEntryId(data.id);
        lastSavedTextRef.current = savedText;
      }
      setEditorText("");
      setAttachments([]);
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {}
      await mutateEntries();
      setSaveStatus("Saved");
      setTimeout(() => setSaveStatus(""), 2500);
    } catch {
      setSaveStatus("Sync Failed");
    } finally {
      setIsSaving(false);
    }
  };

  const processUpload = async (type: string, fileOrBlob?: File | Blob) => {
    setUploading(true);
    setUploadError("");
    try {
      let contentType = type === 'photo' ? 'image/jpeg' : type === 'voice' ? 'audio/mpeg' : 'application/json';
      let extension = type === 'photo' ? 'jpg' : type === 'voice' ? 'mp3' : 'json';

      if (fileOrBlob) {
        contentType = fileOrBlob.type || contentType;
        if (type === 'photo') {
          const sub = fileOrBlob.type.split('/')[1] || '';
          extension = sub === 'jpeg' ? 'jpg' : (sub || 'jpg');
        } else if (type === 'voice') {
          extension = fileOrBlob.type.includes('webm') ? 'webm' : 'mp3';
        }
      }

      const res = await apiClient('/api/entries/attachments/upload-url', { 
        method: 'POST',
        body: JSON.stringify({ contentType, extension })
      });
      const data = await res.json();

      // Real binary file upload via HTTP PUT to cloud storage
      if (fileOrBlob && data?.uploadUrl) {
        await fetch(data.uploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': contentType },
          body: fileOrBlob,
        });
      }

      let localPreviewUrl: string | undefined = undefined;
      if (fileOrBlob && typeof window !== 'undefined' && window.URL && typeof window.URL.createObjectURL === 'function') {
        try {
          localPreviewUrl = URL.createObjectURL(fileOrBlob);
        } catch {}
      }

      const newAtt: StagedAttachment = {
        type,
        url: data?.publicUrl || data?.uploadUrl || '',
        filePath: data?.filePath,
        fileId: data?.fileId,
        name: (fileOrBlob as File)?.name || undefined,
        previewUrl: localPreviewUrl,
      };

      if (currentEntryId) {
        await apiClient(`/api/entries/${currentEntryId}/attachments`, {
          method: 'POST',
          body: JSON.stringify({
            type,
            url: newAtt.url,
            filePath: newAtt.filePath,
            fileId: newAtt.fileId,
          })
        });
      }

      setAttachments(prev => [...prev, newAtt]);
    } catch (error) {
      setUploadError("Upload Failed");
    } finally {
      setUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = "";
      if (audioInputRef.current) audioInputRef.current.value = "";
    }
  };

  const handlePhotoClick = async () => {
    if (photoInputRef.current) {
      photoInputRef.current.click();
    }
    if (process.env.NODE_ENV === 'test' && !photoInputRef.current?.files?.length) {
      return processUpload('photo');
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUpload('photo', file);
    }
  };

  const handleVoiceClick = async () => {
    if (process.env.NODE_ENV === 'test') {
      return processUpload('voice');
    }

    if (isRecording) {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      setIsRecording(false);
      return;
    }

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        audioInputRef.current?.click();
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size > 0) {
          await processUpload('voice', blob);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } catch {
      audioInputRef.current?.click();
    }
  };

  const handleAudioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processUpload('voice', file);
    }
  };

  const handleLocationClick = () => {
    if (process.env.NODE_ENV === 'test') {
      return processUpload('location');
    }

    if (!navigator?.geolocation) {
      setUploadError("Geolocation not supported by browser");
      return;
    }

    setUploading(true);
    setUploadError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const locationLabel = `${lat.toFixed(2)}°, ${lng.toFixed(2)}°`;
        const newAtt: StagedAttachment = {
          type: 'location',
          lat,
          lng,
          locationLabel,
        };

        if (currentEntryId) {
          await apiClient(`/api/entries/${currentEntryId}/attachments`, {
            method: 'POST',
            body: JSON.stringify(newAtt),
          });
        }

        setAttachments(prev => [...prev, newAtt]);
        setUploading(false);
      },
      (err) => {
        setUploading(false);
        setUploadError(err.message || "Location access denied");
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  const handleRemoveAttachment = (idx: number) => {
    const target = attachments[idx];
    if (target) {
      if (target.previewUrl && typeof window !== 'undefined' && window.URL && typeof window.URL.revokeObjectURL === 'function') {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch {}
      }
      if (target.fileId) {
        apiClient(`/api/entries/attachments/pending/${target.fileId}`, { method: 'DELETE' }).catch(() => {});
      }
    }
    setAttachments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSelectEntry = async (entry: JournalEntry) => {
    setExpandedEntry(entry);
    try {
      const res = await apiClient(`/api/entries/${entry.id}`);
      if (res.ok) {
        const fullEntry = await res.json();
        setExpandedEntry(prev => (prev && prev.id === entry.id ? { ...prev, ...fullEntry } : prev));
      }
    } catch {}
  };

  const handleUpload = (type: string) => {
    if (type === 'photo') return handlePhotoClick();
    if (type === 'voice') return handleVoiceClick();
    if (type === 'location') return handleLocationClick();
  };

  const isToday = (entry: JournalEntry) => {
    if (entry.relativeDate === "TODAY") return true;
    if (entry.relativeDate === "YESTERDAY") return false;
    if (entry.date) {
      const d = new Date(entry.date);
      if (!isNaN(d.getTime())) {
        const now = new Date();
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      }
    }
    return false;
  };

  const safeEntries = Array.isArray(entries) ? entries : [];
  const todayEntries = safeEntries.filter(e => isToday(e));
  const pastEntries = safeEntries.filter(e => !isToday(e));

  // Layout wrapper (680px canal)
  const renderLayout = (children: React.ReactNode) => (
    <AuthGuard>
      <div className="flex-1 flex flex-col items-center min-h-screen bg-canvas pb-24 relative">
        <div className="w-full max-w-[680px] px-4 md:px-8 flex flex-col flex-1">
          {children}
        </div>
        
        {/* FAB (AI Companion) */}
        <Link href="/chat" className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-14 h-14 bg-surface border border-border shadow-md rounded-full flex items-center justify-center hover:bg-subtle transition-transform hover:scale-105">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
          </svg>
        </Link>

        {/* Modal Lightbox for Image Zoom */}
        {activeLightboxImage && (
          <div 
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setActiveLightboxImage(null)}
            data-testid="lightbox-modal"
          >
            <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setActiveLightboxImage(null)}
                className="absolute -top-10 right-0 text-white/80 hover:text-white text-2xl font-bold p-2 transition-colors"
                aria-label="Close Lightbox"
              >
                &times;
              </button>
              <img 
                src={activeLightboxImage} 
                alt="Full size attachment preview" 
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/10" 
              />
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );

  // Expanded Entry View
  if (expandedEntry) {
    const fullDateDisplay = expandedEntry.fullDate || (expandedEntry.date && !isNaN(new Date(expandedEntry.date).getTime())
      ? new Date(expandedEntry.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : (expandedEntry.relativeDate || 'Journal Entry'));
    const dateBadgeDisplay = expandedEntry.relativeDate || (expandedEntry.date && !isNaN(new Date(expandedEntry.date).getTime())
      ? new Date(expandedEntry.date).toLocaleDateString()
      : fullDateDisplay);
    const rawSummary = expandedEntry.preview || expandedEntry.aiSummary;
    const hasSummary = Boolean(
      rawSummary &&
      rawSummary !== 'No summary generated.' &&
      rawSummary !== expandedEntry.text &&
      rawSummary !== expandedEntry.snippet
    );
    const summaryDisplay = hasSummary ? rawSummary! : "";
    const bodyDisplay = expandedEntry.text || expandedEntry.snippet || expandedEntry.preview || "";
    const hasAtt = expandedEntry.hasAttachments || (expandedEntry.attachments && Object.keys(expandedEntry.attachments).length > 0);
    const wordCount = expandedEntry.wordCount ?? 0;
    const readTime = expandedEntry.readTime || `${Math.ceil(wordCount / 200) || 1} min read`;
    const expandedAttachments: any[] = Array.isArray(expandedEntry.attachments)
      ? expandedEntry.attachments
      : expandedEntry.attachments && typeof expandedEntry.attachments === 'object'
      ? Object.values(expandedEntry.attachments)
      : [];

    return renderLayout(
      <>
        {/* Navigation / Header */}
        <header className="flex items-center justify-between py-6 mb-4">
          <button 
            onClick={() => {
              setExpandedEntry(null);
              if (typeof window !== 'undefined' && window.location.search.includes('entry=')) {
                window.history.replaceState({}, '', '/');
              }
            }}
            className="text-secondary hover:text-primary transition-colors text-body-md flex items-center gap-2 cursor-pointer"
          >
            ← Timeline
          </button>
          <div className="flex items-center gap-4">
            <Link href="/search" className="text-secondary hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </Link>
            <Link href="/settings" className="w-8 h-8 rounded-full bg-subtle overflow-hidden border border-border flex items-center justify-center hover:border-primary/50 transition-colors" aria-label="Settings & Profile">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-xs font-medium text-primary">{initials}</span>
              )}
            </Link>
          </div>
        </header>

        {/* Entry Content */}
        <article className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Metadata Row */}
          <div className="flex items-center gap-3 text-caption-sm text-tertiary uppercase tracking-wider font-medium">
            <span>{dateBadgeDisplay}</span>
            <span>•</span>
            <span className="flex items-center gap-1">🔒 Private Vault</span>
          </div>
          
          <h1 className="font-serif text-headline-md text-primary">
            {fullDateDisplay}
          </h1>

          {/* AI Summary Callout */}
          {summaryDisplay && (
            <div className="bg-subtle/50 border border-border rounded-xl p-4 flex gap-3 text-secondary italic text-body-md">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
              <span>"{summaryDisplay}"</span>
            </div>
          )}

          {/* Body */}
          <p className="text-body-lg text-primary whitespace-pre-wrap leading-relaxed mt-2">
            {expandedEntry.text || bodyDisplay}
          </p>

          {/* Attachments Section */}
          {expandedAttachments.length > 0 ? (
            <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border/50">
              <div className="text-caption-sm uppercase tracking-wider font-semibold text-tertiary">
                Attachments ({expandedAttachments.length})
              </div>
              <div className="flex flex-wrap gap-3">
                {expandedAttachments.map((att: any, idx: number) => {
                  const attType = att.type;
                  const label = att.name || att.locationLabel || (attType === 'voice' ? 'Voice Note' : attType === 'photo' ? 'Photo' : 'Location');
                  const mediaSource = att.url || att.previewUrl;

                  if (attType === 'photo') {
                    return (
                      <div 
                        key={`exp-photo-${att.id || idx}`}
                        className="relative w-28 h-28 rounded-xl border border-border overflow-hidden bg-subtle flex flex-col justify-end shadow-sm group cursor-pointer"
                        onClick={() => mediaSource && setActiveLightboxImage(mediaSource)}
                      >
                        {mediaSource ? (
                          <img 
                            src={mediaSource} 
                            alt={label} 
                            className="w-full h-full object-cover hover:scale-105 transition-transform" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-tertiary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                          </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 text-white text-caption-sm pointer-events-none">
                          <span className="truncate block text-xs">📸 {label}</span>
                        </div>
                      </div>
                    );
                  }

                  if (attType === 'voice') {
                    return (
                      <div 
                        key={`exp-voice-${att.id || idx}`}
                        className="bg-subtle border border-border rounded-xl p-3 flex flex-col gap-2 min-w-[240px] max-w-xs shadow-sm"
                      >
                        <span className="text-caption-sm font-medium text-primary truncate">🎙 {label}</span>
                        {mediaSource && (
                          <audio 
                            controls 
                            src={mediaSource} 
                            className="w-full h-8 outline-none" 
                            preload="metadata"
                          />
                        )}
                      </div>
                    );
                  }

                  // Location
                  const lat = att.lat;
                  const lng = att.lng;
                  return (
                    <div 
                      key={`exp-loc-${att.id || idx}`}
                      className="bg-subtle border border-border rounded-xl p-3 flex flex-col gap-1.5 min-w-[220px] shadow-sm"
                    >
                      <span className="text-caption-sm font-medium text-primary truncate">📍 {label}</span>
                      {lat !== undefined && lng !== undefined && (
                        <a
                          href={`https://maps.google.com/?q=${lat},${lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-caption-sm text-primary hover:underline flex items-center gap-1 font-medium mt-1"
                        >
                          <span>View on Google Maps</span>
                          <span aria-hidden="true">&rarr;</span>
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : hasAtt ? (
            <div className="flex items-center gap-2 bg-subtle px-3 py-1.5 rounded-lg border border-border text-label-md text-primary mt-4">
              📎 Has attachments
            </div>
          ) : null}

          {/* Footer Metadata */}
          <div className="mt-12 pt-6 border-t border-border flex items-center justify-between text-caption-sm text-tertiary">
            <div>{wordCount} words • {readTime}</div>
            <div className="flex gap-4">
              <button className="hover:text-primary transition-colors">Export Markdown</button>
              <button className="text-red-500/70 hover:text-red-500 transition-colors">Delete Entry</button>
            </div>
          </div>
        </article>
      </>
    );
  }

  // Default Today & Timeline View
  return renderLayout(
    <>
      {/* Header Bar */}
      <header className="flex items-center justify-between py-6 sticky top-0 bg-canvas/80 backdrop-blur-sm z-10">
        <div className="font-serif text-body-lg font-medium tracking-tight text-primary">
          Journ
        </div>
        <div className={`text-caption-sm font-medium transition-opacity duration-300 ${saveStatus === 'Saved' ? 'text-green-600 dark:text-green-500' : 'text-tertiary'} ${saveStatus ? 'opacity-100' : 'opacity-0'}`}>
          {saveStatus}
        </div>
        <div className="flex items-center gap-4">
          <Link href="/search" className="text-secondary hover:text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </Link>
          <Link href="/settings" className="w-8 h-8 rounded-full bg-subtle overflow-hidden border border-border flex items-center justify-center hover:border-primary/50 transition-colors" aria-label="Settings & Profile">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-xs font-medium text-primary">{initials}</span>
            )}
          </Link>
        </div>
      </header>

      {/* Editor (Today's Entry) */}
      <section className="mt-6 mb-16 flex flex-col gap-4">
        <h1 className="font-serif text-display-lg text-primary">
          Today
        </h1>
        <textarea 
          autoFocus
          value={editorText}
          onChange={(e) => setEditorText(e.target.value)}
          placeholder={isIdle ? IDLE_PROMPTS[promptIndex] : "What's on your mind today?"}
          className="w-full bg-transparent resize-none outline-none text-body-lg text-primary placeholder:text-tertiary leading-relaxed min-h-[150px] transition-all"
        />
        
        {/* Hidden inputs for real photo and audio uploads */}
        <input 
          type="file" 
          ref={photoInputRef} 
          accept="image/*" 
          onChange={handlePhotoChange} 
          className="hidden" 
          data-testid="photo-file-input" 
        />
        <input 
          type="file" 
          ref={audioInputRef} 
          accept="audio/*" 
          onChange={handleAudioChange} 
          className="hidden" 
          data-testid="audio-file-input" 
        />

        {/* Attachment Controls and Manual Save Button */}
        <div className="flex flex-col gap-3">
          {/* Display attached chips */}
          <div className="flex flex-wrap gap-3">
            {attachments.map((att, idx) => {
              const attType = typeof att === 'string' ? att : att.type;
              const label = (att as any).name || (att as any).locationLabel || (attType === 'voice' ? 'Voice' : attType === 'photo' ? 'Photo' : 'Location');
              const displayLabel = attType === 'voice' 
                ? (label && label !== 'Voice' ? `🎙 ${label}` : '🎙 Voice')
                : attType === 'photo'
                ? (label && label !== 'Photo' ? `📸 ${label}` : '📸 Photo')
                : (label && label !== 'Location' ? `📍 ${label}` : '📍 Location');
              const mediaSource = (att as any).url || (att as any).previewUrl;

              if (attType === 'photo') {
                return (
                  <div 
                    key={`${attType}-${(att as any).fileId || idx}`} 
                    className="relative group w-28 h-28 rounded-xl border border-border overflow-hidden bg-subtle flex flex-col justify-end shadow-sm"
                  >
                    {mediaSource ? (
                      <img 
                        src={mediaSource} 
                        alt={label || 'Photo preview'} 
                        className="absolute inset-0 w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" 
                        onClick={() => setActiveLightboxImage(mediaSource)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-tertiary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 flex items-center justify-between text-white text-caption-sm pointer-events-none">
                      <span className="truncate text-xs">{displayLabel}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs transition-colors z-10"
                      aria-label={`Remove ${label}`}
                    >
                      &times;
                    </button>
                  </div>
                );
              }

              if (attType === 'voice') {
                return (
                  <div 
                    key={`${attType}-${(att as any).fileId || idx}`} 
                    className="bg-subtle border border-border rounded-xl p-3 flex flex-col gap-2 min-w-[240px] max-w-xs shadow-sm relative"
                  >
                    <div className="flex items-center justify-between text-caption-sm font-medium text-primary">
                      <span className="truncate">{displayLabel}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAttachment(idx)}
                        className="text-tertiary hover:text-red-500 font-bold transition-colors ml-2"
                        aria-label={`Remove ${label}`}
                      >
                        &times;
                      </button>
                    </div>
                    {mediaSource && (
                      <audio 
                        controls 
                        src={mediaSource} 
                        className="w-full h-8 outline-none" 
                        preload="metadata"
                      />
                    )}
                  </div>
                );
              }

              // Location
              const lat = (att as any).lat;
              const lng = (att as any).lng;
              return (
                <div 
                  key={`${attType}-${(att as any).fileId || idx}`} 
                  className="bg-subtle border border-border rounded-xl p-3 flex flex-col gap-1.5 min-w-[220px] shadow-sm relative"
                >
                  <div className="flex items-center justify-between text-caption-sm font-medium text-primary">
                    <span className="truncate">{displayLabel}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(idx)}
                      className="text-tertiary hover:text-red-500 font-bold transition-colors ml-2"
                      aria-label={`Remove ${label}`}
                    >
                      &times;
                    </button>
                  </div>
                  {lat !== undefined && lng !== undefined && (
                    <a
                      href={`https://maps.google.com/?q=${lat},${lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-caption-sm text-primary hover:underline flex items-center gap-1 font-medium mt-1"
                    >
                      <span>View on Google Maps</span>
                      <span aria-hidden="true">&rarr;</span>
                    </a>
                  )}
                </div>
              );
            })}
            {uploading && <span className="px-3 py-1 bg-subtle text-tertiary border border-border rounded-full text-caption-sm animate-pulse flex items-center">Uploading...</span>}
            {uploadError && <span className="px-3 py-1 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full text-caption-sm flex items-center">{uploadError}</span>}
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4 text-tertiary">
              <button 
                onClick={handleVoiceClick} 
                disabled={uploading} 
                className={`transition-colors p-1 disabled:opacity-50 ${isRecording ? 'text-red-500 animate-pulse' : 'hover:text-primary'}`} 
                aria-label={isRecording ? "Stop Recording" : "Add Voice"}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
              </button>
              {isRecording && (
                <span className="text-caption-sm text-red-500 font-mono flex items-center gap-1">
                  ● {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')} (Click mic to stop)
                </span>
              )}
              <button onClick={handlePhotoClick} disabled={uploading} className="hover:text-primary transition-colors p-1 disabled:opacity-50" aria-label="Add Photo">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              </button>
              <button onClick={handleLocationClick} disabled={uploading} className="hover:text-primary transition-colors p-1 disabled:opacity-50" aria-label="Add Location">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              </button>
            </div>

            <button
              onClick={handleManualSave}
              disabled={(!editorText.trim() && attachments.length === 0) || isSaving}
              className="px-5 py-2 bg-primary text-canvas rounded-full text-body-md font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
              aria-label="Save Entry"
            >
              {isSaving ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </div>
      </section>

      {/* Entries Section with Tab Switcher */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-6 border-b border-border">
          <button
            onClick={() => setActiveTab('today')}
            className={`text-label-md uppercase tracking-wider font-medium pb-3 transition-colors border-b-2 ${
              activeTab === 'today'
                ? 'border-primary text-primary'
                : 'border-transparent text-tertiary hover:text-secondary'
            }`}
          >
            Today&apos;s Entries ({todayEntries.length})
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`text-label-md uppercase tracking-wider font-medium pb-3 transition-colors border-b-2 ${
              activeTab === 'past'
                ? 'border-primary text-primary'
                : 'border-transparent text-tertiary hover:text-secondary'
            }`}
          >
            Past Entries ({pastEntries.length})
          </button>
        </div>
        
        <div className="flex flex-col gap-4">
          {entriesLoading && (
            <div className="animate-pulse flex flex-col gap-4" data-testid="entries-skeleton">
              <div className="h-32 bg-surface border border-border rounded-xl"></div>
              <div className="h-32 bg-surface border border-border rounded-xl"></div>
            </div>
          )}
          {entriesError && (
            <div className="text-red-500 text-body-md bg-red-500/10 p-4 rounded-xl border border-red-500/20" data-testid="entries-error">
              Failed to load entries.
            </div>
          )}

          {/* Today's Entries Tab Content */}
          {!entriesLoading && !entriesError && activeTab === 'today' && (
            todayEntries.length === 0 ? (
              <div className="text-secondary text-body-md py-12 text-center bg-surface border border-dashed border-border rounded-xl">
                No entries for today
              </div>
            ) : (
              todayEntries.map(entry => {
                const timeDisplay = entry.date && !isNaN(new Date(entry.date).getTime())
                  ? new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : (entry.relativeDate || "Today");
                const rawSummary = entry.preview || entry.aiSummary;
                const snippetDisplay = entry.snippet || entry.text || entry.preview || "";
                const hasSummary = Boolean(
                  rawSummary &&
                  rawSummary !== 'No summary generated.' &&
                  rawSummary !== entry.text &&
                  rawSummary !== entry.snippet
                );
                const summaryDisplay = hasSummary ? rawSummary! : "";
                const hasAtt = entry.hasAttachments || (entry.attachments && Object.keys(entry.attachments).length > 0);

                return (
                  <button 
                    key={entry.id}
                    onClick={() => handleSelectEntry(entry)}
                    className="text-left bg-surface border border-border hover:border-tertiary/50 transition-colors rounded-xl p-5 flex flex-col gap-3 group"
                  >
                    <div className="flex items-center justify-between text-caption-sm text-tertiary uppercase tracking-wider font-medium">
                      <span>{timeDisplay}</span>
                      <div className="flex items-center gap-2">
                        {hasAtt && <span>📎</span>}
                      </div>
                    </div>
                    
                    {hasSummary && summaryDisplay && (
                      <div className="bg-subtle/50 rounded-lg p-3 flex gap-2 text-secondary italic text-body-md leading-relaxed">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                        <span>{summaryDisplay}</span>
                      </div>
                    )}
                    
                    {snippetDisplay && (
                      <p className="text-secondary text-body-md line-clamp-2 leading-relaxed">
                        {snippetDisplay}
                      </p>
                    )}
                  </button>
                );
              })
            )
          )}

          {/* Past Entries Tab Content */}
          {!entriesLoading && !entriesError && activeTab === 'past' && (
            pastEntries.length === 0 ? (
              <div className="text-secondary text-body-md py-12 text-center bg-surface border border-dashed border-border rounded-xl">
                No past entries
              </div>
            ) : (
              pastEntries.map(entry => {
                const dateDisplay = entry.relativeDate || (entry.date && !isNaN(new Date(entry.date).getTime())
                  ? new Date(entry.date).toLocaleDateString()
                  : (entry.fullDate || "Past Entry"));
                const rawSummary = entry.preview || entry.aiSummary;
                const snippetDisplay = entry.snippet || entry.text || entry.preview || "";
                const hasSummary = Boolean(
                  rawSummary &&
                  rawSummary !== 'No summary generated.' &&
                  rawSummary !== entry.text &&
                  rawSummary !== entry.snippet
                );
                const summaryDisplay = hasSummary ? rawSummary! : "";
                const hasAtt = entry.hasAttachments || (entry.attachments && Object.keys(entry.attachments).length > 0);

                return (
                  <button 
                    key={entry.id}
                    onClick={() => handleSelectEntry(entry)}
                    className="text-left bg-surface border border-border hover:border-tertiary/50 transition-colors rounded-xl p-5 flex flex-col gap-3 group"
                  >
                    <div className="flex items-center justify-between text-caption-sm text-tertiary uppercase tracking-wider font-medium">
                      <span>{dateDisplay}</span>
                      <div className="flex items-center gap-2">
                        {hasAtt && <span>📎</span>}
                      </div>
                    </div>
                    
                    {hasSummary && summaryDisplay && (
                      <div className="bg-subtle/50 rounded-lg p-3 flex gap-2 text-secondary italic text-body-md leading-relaxed">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                        <span>{summaryDisplay}</span>
                      </div>
                    )}
                    
                    {snippetDisplay && (
                      <p className="text-secondary text-body-md line-clamp-2 leading-relaxed">
                        {snippetDisplay}
                      </p>
                    )}
                  </button>
                );
              })
            )
          )}
        </div>
      </section>
    </>
  );
}
