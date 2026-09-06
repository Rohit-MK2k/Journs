"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { apiClient } from "@/lib/apiClient";

export type SearchResult = {
  id: string;
  date: string;
  location?: string;
  matchScore: number;
  semanticChips: string[];
  snippet: string;
  summary?: string;
  attachments?: { voice?: boolean; photo?: boolean };
};

export default function SearchOverlay() {
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isExiting, setIsExiting] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsExiting(true);
        setTimeout(() => router.push("/"), 300);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const executeSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setHasSearched(true);
    setIsSearching(true);
    try {
      const res = await apiClient(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      const raw = Array.isArray(data) ? data : (data.matches || []);
      const formatted: SearchResult[] = raw.map((m: any) => {
        if (m.entry) {
          const e = m.entry;
          const dateStr = e.date ? new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
          const atts = Array.isArray(e.attachments) ? e.attachments : [];
          return {
            id: e.id,
            date: dateStr,
            matchScore: m.matchScore,
            semanticChips: m.semanticChips || [],
            snippet: e.text || '',
            summary: e.summary || m.summary || '',
            attachments: {
              voice: atts.some((a: any) => a.type === 'voice'),
              photo: atts.some((a: any) => a.type === 'photo'),
            },
          };
        }
        return m;
      });
      setResults(formatted);
    } catch (err) {
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(query);
  };

  const handleClear = () => {
    setQuery("");
    setHasSearched(false);
    setResults([]);
    inputRef.current?.focus();
  };

  return (
    <AuthGuard>
      <div className={`min-h-screen bg-canvas md:bg-black/40 md:backdrop-blur-sm flex justify-center p-0 md:p-6 lg:p-12 transition-opacity duration-300 ${isExiting ? "opacity-0" : "opacity-100"}`}>
        
        <div className="w-full max-w-[720px] bg-canvas md:bg-surface md:rounded-2xl md:shadow-2xl md:border md:border-border flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 md:slide-in-from-top-4 duration-300 h-screen md:h-auto md:max-h-[85vh]">
          
        {/* Header & Search Bar */}
        <div className="p-4 md:p-6 border-b border-border bg-canvas md:bg-surface/95 sticky top-0 z-10 backdrop-blur">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiary group-focus-within:text-primary transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </div>
            
            <input
              ref={inputRef}
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask or search anything (e.g., 'when did I feel relieved or stressed')..."
              className="w-full bg-subtle border border-border rounded-full py-3.5 pl-12 pr-12 text-body-lg text-primary placeholder:text-tertiary outline-none focus:ring-2 focus:ring-tertiary/20 transition-all"
            />
            
            {query && (
              <button 
                type="button" 
                onClick={handleClear}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-tertiary hover:text-primary p-1 bg-surface rounded-full shadow-sm border border-border transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            )}
          </form>
          
          <div className="flex justify-between items-center mt-3 px-2 text-caption-sm text-tertiary">
            <div>Vertex AI Semantic Vector Recall</div>
            <div className="hidden md:flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-subtle border border-border rounded text-[10px] font-sans">Esc</kbd> to dismiss
            </div>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-canvas md:bg-surface">
          
          {/* STATE 1: Initial State */}
          {!hasSearched && (
            <div className="animate-in fade-in duration-500 py-12 text-center text-tertiary">
              <p className="text-body-lg">Search your journal by memory, topic, or feeling.</p>
              <p className="text-caption-sm mt-1">Semantic search finds relevant entries even without exact keyword matches.</p>
            </div>
          )}

          {/* STATE 2: Semantic Results */}
          {hasSearched && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
              
              {isSearching ? (
                <div data-testid="search-loader" className="flex items-center justify-center py-12 text-tertiary gap-2">
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse delay-75"></span>
                  <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse delay-150"></span>
                  <span className="ml-2 text-body-md">Searching your mind...</span>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-12 text-tertiary">
                  <p className="text-body-lg">No reflections found for "{query}".</p>
                  <p className="text-caption-sm mt-2">Try a different phrasing or explore broader topics.</p>
                </div>
              ) : (
                <>
                  {/* Equal Unified Results List */}
                  <div className="flex flex-col gap-4">
                    {results.map((res) => (
                      <div 
                        key={res.id}
                        onClick={() => res.id && router.push(`/?entry=${res.id}`)}
                        className="bg-canvas md:bg-surface border border-border rounded-xl p-5 shadow-sm relative overflow-hidden cursor-pointer hover:border-primary/40 transition-all flex flex-col"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-[11px] font-semibold tracking-wide uppercase w-fit">
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                              {res.matchScore}% Semantic Match
                            </span>
                            <div className="text-caption-sm text-tertiary">{res.date}{res.location && ` • ${res.location}`}</div>
                          </div>
                        </div>

                        {res.summary && res.summary !== 'No summary generated.' && (
                          <div className="bg-subtle/60 border border-border/50 rounded-lg p-3 flex gap-2.5 text-secondary italic text-body-md mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5 text-blue-500"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                            <span>{res.summary}</span>
                          </div>
                        )}

                        <p className="text-body-lg text-primary leading-relaxed mb-4" dangerouslySetInnerHTML={{ __html: res.snippet }} />

                        {(res.attachments?.voice || res.attachments?.photo) && (
                          <div className="flex gap-2 mb-5">
                            {res.attachments?.voice && (
                              <div className="flex items-center gap-2 bg-subtle px-2.5 py-1 rounded-lg border border-border text-xs text-primary">
                                ▶ Voice memo
                              </div>
                            )}
                            {res.attachments?.photo && (
                              <div className="flex items-center gap-2 bg-subtle px-2.5 py-1 rounded-lg border border-border text-xs text-primary">
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                                Photo attached
                              </div>
                            )}
                          </div>
                        )}

                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (res.id) router.push(`/?entry=${res.id}`);
                          }}
                          className="text-body-md font-medium text-primary hover:text-blue-600 transition-colors flex items-center gap-1 cursor-pointer w-fit"
                        >
                          Tap to read full entry <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="text-center py-6 text-caption-sm text-tertiary border-t border-border mt-2">
                    End of semantic vector matches · {results.length} entries surfaced
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Reverse Transition Indicator (Visible only when escaping) */}
      {isExiting && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-surface border border-border shadow-lg rounded-full px-4 py-2 flex items-center gap-2 text-caption-sm text-primary z-50">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
          ← Returning to Search • collapsing canvas
        </div>
      )}
      </div>
    </AuthGuard>
  );
}
