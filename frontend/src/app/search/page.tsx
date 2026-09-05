"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SearchOverlay() {
  const [query, setQuery] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle ESC shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsExiting(true);
        // Simulate reverse transition before navigating
        setTimeout(() => router.push("/"), 300);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setHasSearched(true);
    }
  };

  const handleClear = () => {
    setQuery("");
    setHasSearched(false);
    inputRef.current?.focus();
  };

  return (
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
          
          {/* STATE 1: Suggestions (Initial State) */}
          {!hasSearched && (
            <div className="animate-in fade-in duration-500">
              <h3 className="text-label-md uppercase tracking-wider text-tertiary font-medium mb-4">Suggested Reflections</h3>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => { setQuery("when did I decide to simplify the architecture during a walk?"); setHasSearched(true); }}
                  className="text-left p-4 rounded-xl border border-border bg-subtle/50 hover:bg-subtle transition-colors flex flex-col gap-1.5"
                >
                  <div className="text-body-md text-primary font-medium">“When did I decide to simplify the architecture during a walk?”</div>
                  <div className="text-caption-sm text-secondary">Matches 2 entries • September 2024</div>
                </button>
                <button 
                  onClick={() => { setQuery("Reflections about morning coffee and clarity in San Francisco"); setHasSearched(true); }}
                  className="text-left p-4 rounded-xl border border-border bg-subtle/50 hover:bg-subtle transition-colors flex flex-col gap-1.5"
                >
                  <div className="text-body-md text-primary font-medium">“Reflections about morning coffee and clarity in San Francisco”</div>
                </button>
                <button 
                  onClick={() => { setQuery("Moments of feeling overwhelmed by project scope in August"); setHasSearched(true); }}
                  className="text-left p-4 rounded-xl border border-border bg-subtle/50 hover:bg-subtle transition-colors flex flex-col gap-1.5"
                >
                  <div className="text-body-md text-primary font-medium">“Moments of feeling overwhelmed by project scope in August”</div>
                </button>
              </div>

              <h3 className="text-label-md uppercase tracking-wider text-tertiary font-medium mt-8 mb-4">Recent Searches</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-subtle text-secondary rounded-lg text-body-md cursor-pointer hover:text-primary transition-colors border border-border">project planning</span>
                <span className="px-3 py-1.5 bg-subtle text-secondary rounded-lg text-body-md cursor-pointer hover:text-primary transition-colors border border-border">anxiety</span>
              </div>
            </div>
          )}

          {/* STATE 2: Semantic Results */}
          {hasSearched && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
              
              {/* Active Result Card (Primary Match) */}
              <div className="bg-canvas md:bg-surface border border-border rounded-xl p-5 shadow-sm relative overflow-hidden ring-1 ring-primary/5">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                
                <div className="flex items-start justify-between mb-3">
                  <div className="flex flex-col gap-1">
                    <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-[11px] font-semibold tracking-wide uppercase">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
                      98% Semantic Match
                    </span>
                    <div className="text-caption-sm text-tertiary">Tuesday, September 3, 2024 • Bernal Heights</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="px-2 py-0.5 bg-subtle text-secondary border border-border rounded-md text-xs">architecture decisions</span>
                  <span className="px-2 py-0.5 bg-subtle text-secondary border border-border rounded-md text-xs">strip away complex state machine</span>
                  <span className="px-2 py-0.5 bg-subtle text-secondary border border-border rounded-md text-xs">simplicity is a discipline</span>
                </div>

                <p className="text-body-lg text-primary leading-relaxed mb-4">
                  The fog was heavy this morning, but by the time I hit Golden Gate Park, the sun was breaking through. I realized that the complexity of the current system is mostly in how we handle state. If we just <span className="bg-blue-500/20 text-blue-900 dark:text-blue-200 rounded px-1">strip away the complex state machine</span> and focus on native component lifecycles, everything gets easier. <span className="bg-blue-500/20 text-blue-900 dark:text-blue-200 rounded px-1">Architecture decisions</span> shouldn't be driven by fear of doing things manually. <span className="bg-blue-500/20 text-blue-900 dark:text-blue-200 rounded px-1">Simplicity is a discipline.</span>
                </p>

                <div className="flex gap-2 mb-5">
                  <div className="flex items-center gap-2 bg-subtle px-2.5 py-1 rounded-lg border border-border text-xs text-primary">
                    ▶ Voice memo
                  </div>
                  <div className="flex items-center gap-2 bg-subtle px-2.5 py-1 rounded-lg border border-border text-xs text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                    Photo attached
                  </div>
                </div>

                <button className="text-body-md font-medium text-primary hover:text-blue-600 transition-colors flex items-center gap-1">
                  Tap to read full entry <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </button>
              </div>

              {/* Secondary Clustered Results */}
              <div className="opacity-80 scale-[0.98] origin-top">
                <div className="bg-canvas md:bg-surface border border-border rounded-xl p-4 flex flex-col gap-2 shadow-sm mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-subtle text-secondary rounded text-[10px] font-semibold tracking-wide uppercase">81% Semantic Match</span>
                    <span className="text-caption-sm text-tertiary">August 24, 2024</span>
                  </div>
                  <p className="text-body-md text-secondary line-clamp-2">
                    I spent 3 hours overcomplicating the router. Sometimes <span className="bg-blue-500/10 text-primary px-1 rounded">simplicity</span> requires rewriting things from scratch just to realize you didn't need half the abstractions.
                  </p>
                </div>

                <div className="bg-canvas md:bg-surface border border-border rounded-xl p-4 flex flex-col gap-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-subtle text-secondary rounded text-[10px] font-semibold tracking-wide uppercase">74% Semantic Match</span>
                    <span className="text-caption-sm text-tertiary">August 12, 2024</span>
                  </div>
                  <p className="text-body-md text-secondary line-clamp-2">
                    Walked near the beach. Thinking about how the <span className="bg-blue-500/10 text-primary px-1 rounded">architecture</span> of my day affects my mood more than the tasks themselves.
                  </p>
                </div>
              </div>

              <div className="text-center py-6 text-caption-sm text-tertiary border-t border-border mt-2">
                End of semantic vector matches · 3 entries surfaced
              </div>

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
  );
}
