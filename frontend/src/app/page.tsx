"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { apiClient } from "@/lib/apiClient";

// Mock Data (will be replaced by SWR in full integration)
const MOCK_PAST_ENTRIES = [
  {
    id: "1",
    relativeDate: "YESTERDAY",
    fullDate: "Tuesday, September 3, 2024",
    aiSummary: "Walked through the park after rain and outlined architecture decisions for the new project.",
    snippet: "The fog was heavy this morning, but by the time I hit Golden Gate Park, the sun was breaking through. I realized that the complexity of the current system is mostly in how we handle state. If we just strip it back...",
    wordCount: 114,
    readTime: "1 min read",
    attachments: { voice: true, location: "Golden Gate Park, SF" }
  },
  {
    id: "2",
    relativeDate: "MONDAY",
    fullDate: "Monday, September 2, 2024",
    aiSummary: "Feeling overwhelmed by project scope, decided to break things down into smaller tasks.",
    snippet: "Sitting at Blue Bottle again. I need to stop thinking about the entire application at once. It's paralyzing. Today's goal is just to get the auth flow working. Everything else can wait...",
    wordCount: 82,
    readTime: "1 min read",
    attachments: { location: "Blue Bottle Coffee, SF" }
  }
];

export default function MainDashboard() {
  const [editorText, setEditorText] = useState("");
  const [saveStatus, setSaveStatus] = useState<"Saving..." | "Saved" | "Sync Failed" | "">("");
  const [expandedEntry, setExpandedEntry] = useState<typeof MOCK_PAST_ENTRIES[0] | null>(null);
  const isFirstRender = useRef(true);
  
  // Autosave integration logic
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    if (!editorText) return;
    setSaveStatus("Saving...");
    
    const timeout = setTimeout(async () => {
      try {
        await apiClient('/api/entries/autosave', {
          method: 'POST',
          body: JSON.stringify({ text: editorText })
        });
        setSaveStatus("Saved");
        setTimeout(() => setSaveStatus(""), 2000);
      } catch (error) {
        setSaveStatus("Sync Failed");
      }
    }, 1000);
    
    return () => clearTimeout(timeout);
  }, [editorText]);

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
      </div>
    </AuthGuard>
  );

  // Expanded Entry View
  if (expandedEntry) {
    return renderLayout(
      <>
        {/* Navigation / Header */}
        <header className="flex items-center justify-between py-6 mb-4">
          <button 
            onClick={() => setExpandedEntry(null)}
            className="text-secondary hover:text-primary transition-colors text-body-md flex items-center gap-2"
          >
            ← Timeline
          </button>
          <div className="flex items-center gap-4">
            <Link href="/search" className="text-secondary hover:text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </Link>
            <Link href="/settings" className="w-8 h-8 rounded-full bg-subtle overflow-hidden border border-border flex items-center justify-center">
              <span className="text-xs font-medium">AC</span>
            </Link>
          </div>
        </header>

        {/* Entry Content */}
        <article className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Metadata Row */}
          <div className="flex items-center gap-3 text-caption-sm text-tertiary uppercase tracking-wider font-medium">
            <span>{expandedEntry.relativeDate}</span>
            <span>•</span>
            <span className="flex items-center gap-1">🔒 Private Vault</span>
          </div>
          
          <h1 className="font-serif text-headline-md text-primary">
            {expandedEntry.fullDate}
          </h1>

          {/* AI Summary Callout */}
          <div className="bg-subtle/50 border border-border rounded-xl p-4 flex gap-3 text-secondary italic text-body-md">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
            <span>"{expandedEntry.aiSummary}"</span>
          </div>

          {/* Body */}
          <p className="text-body-lg text-primary whitespace-pre-wrap leading-relaxed mt-2">
            {expandedEntry.snippet}
            {"\n\n(This is a full entry view, mocked for the UI specification. In the real app, this would show the unabridged text with generous editorial line spacing.)"}
          </p>

          {/* Attachments Strip */}
          <div className="flex flex-wrap gap-2 mt-4">
            {expandedEntry.attachments.voice && (
              <div className="flex items-center gap-2 bg-subtle px-3 py-1.5 rounded-lg border border-border text-label-md text-primary">
                ▶ Voice memo (1:18)
              </div>
            )}
            {expandedEntry.attachments.location && (
              <div className="flex items-center gap-2 bg-subtle px-3 py-1.5 rounded-lg border border-border text-label-md text-primary">
                📍 {expandedEntry.attachments.location}
              </div>
            )}
          </div>

          {/* Footer Metadata */}
          <div className="mt-12 pt-6 border-t border-border flex items-center justify-between text-caption-sm text-tertiary">
            <div>{expandedEntry.wordCount} words • {expandedEntry.readTime}</div>
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
          <Link href="/settings" className="w-8 h-8 rounded-full bg-subtle overflow-hidden border border-border flex items-center justify-center">
             <span className="text-xs font-medium">AC</span>
          </Link>
        </div>
      </header>

      {/* Editor (Today's Entry) */}
      <section className="mt-6 mb-16 flex flex-col gap-4">
        <h1 className="font-serif text-display-lg text-primary">
          Today — Wednesday, Sept 4
        </h1>
        <textarea 
          autoFocus
          value={editorText}
          onChange={(e) => setEditorText(e.target.value)}
          placeholder="What's on your mind today?"
          className="w-full bg-transparent resize-none outline-none text-body-lg text-primary placeholder:text-tertiary leading-relaxed min-h-[150px]"
        />
        
        {/* Attachment Controls */}
        <div className="flex items-center gap-4 pt-4 text-tertiary">
          <button className="hover:text-primary transition-colors p-1" aria-label="Add Voice">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
          </button>
          <button className="hover:text-primary transition-colors p-1" aria-label="Add Photo">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
          </button>
          <button className="hover:text-primary transition-colors p-1" aria-label="Add Location">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
          </button>
        </div>
      </section>

      {/* Timeline (Past Entries) */}
      <section className="flex flex-col gap-6">
        <h2 className="text-label-md uppercase tracking-wider text-tertiary font-medium border-b border-border pb-2">
          Recent Entries
        </h2>
        
        <div className="flex flex-col gap-4">
          {MOCK_PAST_ENTRIES.map(entry => (
            <button 
              key={entry.id}
              onClick={() => setExpandedEntry(entry)}
              className="text-left bg-surface border border-border hover:border-tertiary/50 transition-colors rounded-xl p-5 flex flex-col gap-3 group"
            >
              <div className="flex items-center justify-between text-caption-sm text-tertiary uppercase tracking-wider font-medium">
                <span>{entry.relativeDate}</span>
                <div className="flex items-center gap-2">
                  {entry.attachments.voice && <span>🎙</span>}
                  {entry.attachments.location && <span>📍</span>}
                </div>
              </div>
              
              <div className="bg-subtle/50 rounded-lg p-3 flex gap-2 text-secondary italic text-body-md line-clamp-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                <span className="truncate">{entry.aiSummary}</span>
              </div>
              
              <p className="text-secondary text-body-md line-clamp-2 leading-relaxed">
                {entry.snippet}
              </p>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
