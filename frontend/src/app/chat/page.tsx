"use client";

import React, { useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { apiClient } from "@/lib/apiClient";

type ChatMode = "text" | "voice" | "edit";

export default function ChatCompanion() {
  const [mode, setMode] = useState<ChatMode>("text");
  const [inputText, setInputText] = useState("");
  const [draftContent, setDraftContent] = useState(
    "You mentioned simplifying the architecture and stripping away the complex state machine. I've drafted this note to capture your thoughts from the walk at Golden Gate Park."
  );
  const [destination, setDestination] = useState<"append" | "new">("append");

  // Layout wrapper representing the modal/drawer on desktop or full screen on mobile
  const renderLayout = (children: React.ReactNode, hideHeader = false) => (
    <AuthGuard>
      <div className="flex-1 flex flex-col items-center min-h-screen bg-canvas md:bg-black/5 md:py-12">
        <div className="w-full h-screen md:h-auto md:min-h-[700px] md:max-w-[500px] bg-canvas md:bg-surface md:rounded-2xl md:border md:border-border md:shadow-lg flex flex-col relative overflow-hidden">
          {!hideHeader && (
            <header className="flex items-center justify-between px-4 py-4 border-b border-border bg-canvas/80 md:bg-surface/80 backdrop-blur-sm z-10">
              <div className="flex items-center gap-2 font-medium text-body-md text-primary">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                Reflect
              </div>
              
              {/* Dual Mode Switcher */}
              <div className="flex items-center bg-subtle p-1 rounded-full border border-border">
                <button 
                  onClick={() => setMode("text")}
                  className={`px-3 py-1 text-label-md rounded-full transition-colors ${mode === 'text' ? 'bg-surface shadow-sm text-primary' : 'text-secondary hover:text-primary'}`}
                >
                  ≡ Text
                </button>
                <button 
                  onClick={() => setMode("voice")}
                  className={`px-3 py-1 text-label-md rounded-full transition-colors flex items-center gap-1 ${mode === 'voice' ? 'bg-surface shadow-sm text-primary' : 'text-secondary hover:text-primary'}`}
                >
                  🎙 Voice
                </button>
              </div>
              
              <Link href="/" className="text-secondary hover:text-primary p-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </Link>
            </header>
          )}
          {children}
        </div>
      </div>
    </AuthGuard>
  );

  if (mode === "edit") {
    return renderLayout(
      <div className="flex flex-col flex-1 h-full animate-in slide-in-from-bottom-4 duration-300">
        {/* Edit Mode Header */}
        <header className="flex items-center justify-between px-4 py-4 border-b border-border bg-canvas md:bg-surface z-10">
          <button onClick={() => setMode("text")} className="text-secondary hover:text-primary text-body-md">
            Cancel
          </button>
          <div className="font-medium text-primary text-body-md">Edit Drafted Note</div>
          <button onClick={() => setMode("text")} className="text-primary font-medium text-body-md">
            Update
          </button>
        </header>

        <div className="flex flex-col flex-1 overflow-y-auto p-4 md:p-6 gap-6">
          {/* Synthesis Source */}
          <div className="flex flex-col gap-2 p-3 bg-subtle rounded-lg border border-border">
            <div className="text-caption-sm text-tertiary uppercase tracking-wider font-medium flex justify-between">
              <span>Journ Companion • Today at 10:45 AM</span>
              <span className="bg-canvas px-2 py-0.5 rounded text-secondary border border-border">Raw synthesis</span>
            </div>
            <div className="text-body-md text-secondary italic">
              "Trigger prompt: 'Simplicity in layered architecture'"
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <h1 className="font-serif text-headline-md text-primary">Wednesday, Sept 4 — Draft Reflection</h1>
            <div className="text-caption-sm text-tertiary">
              47 words • ~1 min read • <span className="text-amber-600 dark:text-amber-500">Unsaved to journal</span>
            </div>
          </div>

          {/* Editable Canvas */}
          <textarea 
            value={draftContent}
            onChange={(e) => setDraftContent(e.target.value)}
            className="w-full flex-1 bg-transparent resize-none outline-none text-body-lg text-primary leading-relaxed min-h-[200px]"
            autoFocus
          />

          {/* Attachments Strip */}
          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-subtle px-3 py-1.5 rounded-lg border border-border text-label-md text-primary">
              ▶ Voice snippet (0:24)
            </div>
            <button className="flex items-center gap-2 bg-canvas px-3 py-1.5 rounded-lg border border-dashed border-tertiary text-label-md text-tertiary hover:text-primary hover:border-border transition-colors">
              + Add photo
            </button>
          </div>

          {/* Destination Selector */}
          <div className="flex flex-col gap-3 mt-4">
            <label className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-subtle transition-colors">
              <input type="radio" name="destination" checked={destination === "append"} onChange={() => setDestination("append")} className="mt-1" />
              <div>
                <div className="font-medium text-primary text-body-md">Append to Today's Entry</div>
                <div className="text-tertiary text-caption-sm">Merges as a new section under Sept 4</div>
              </div>
            </label>
            <label className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-subtle transition-colors">
              <input type="radio" name="destination" checked={destination === "new"} onChange={() => setDestination("new")} className="mt-1" />
              <div>
                <div className="font-medium text-primary text-body-md">Create as New Separate Entry</div>
                <div className="text-tertiary text-caption-sm">Standalone entry in timeline archives</div>
              </div>
            </label>
          </div>
        </div>

        {/* Action Bar */}
        <footer className="p-4 border-t border-border bg-canvas md:bg-surface">
          <div className="flex items-center justify-between mb-3">
            <button className="text-red-500/70 hover:text-red-500 text-body-md font-medium transition-colors" onClick={() => setMode("text")}>
              Discard Draft
            </button>
            <button className="bg-primary text-canvas px-4 py-2 rounded-lg font-medium text-body-md hover:opacity-90 transition-opacity" onClick={() => setMode("text")}>
              {destination === "append" ? "Save to Today's Entry" : "Save as New Entry"}
            </button>
          </div>
          <div className="text-center text-[10px] text-tertiary">
            🔒 Autosaved as draft • Nothing commits to your permanent journal until confirmed.
          </div>
        </footer>
      </div>,
      true // hide main header
    );
  }

  if (mode === "voice") {
    return renderLayout(
      <div className="flex flex-col flex-1 h-full animate-in fade-in duration-500">
        <div className="flex-1 flex flex-col items-center justify-center relative p-8 text-center">
          
          {/* Concentric Audio Pulse Rings */}
          <div className="relative flex items-center justify-center mb-12">
            <div className="absolute w-48 h-48 bg-blue-500/10 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
            <div className="absolute w-32 h-32 bg-blue-500/20 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
            <div className="relative w-20 h-20 bg-surface border border-border shadow-md rounded-full flex items-center justify-center text-blue-500 z-10">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            </div>
          </div>

          <h2 className="text-headline-md font-medium text-primary mb-2">Companion is listening...</h2>
          <p className="text-body-md text-secondary">
            Speak naturally • Journ transcribes reflections into journal notes in real-time
          </p>

          {/* Live Draft Indicator */}
          <div className="w-full mt-12 bg-subtle/50 border border-border rounded-xl p-4 text-left animate-in slide-in-from-bottom-2 fade-in">
            <div className="text-caption-sm text-tertiary font-medium mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Syncing with Evening Reflections
            </div>
            <div className="text-primary text-body-md italic line-clamp-2">
              "It's been a long day, I feel like I'm finally making progress on the architecture..."
            </div>
          </div>
        </div>

        {/* Bottom Control Dock */}
        <footer className="p-6 border-t border-border bg-canvas/80 md:bg-surface/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <button className="w-12 h-12 flex items-center justify-center rounded-full bg-subtle text-secondary hover:text-primary transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23M12 19v4m-2 0h4"/></svg>
            </button>
            <div className="px-6 py-3 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium text-body-md animate-pulse">
              Speaking
            </div>
            <button onClick={() => setMode("text")} className="w-12 h-12 flex items-center justify-center rounded-full bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          <div className="mt-4 text-center text-caption-sm text-tertiary flex items-center justify-center gap-1.5">
            <span>🔒</span> End-to-end encrypted voice session • Real-time ADK audio channel
          </div>
        </footer>
      </div>
    );
  }

  // Default Text Mode
  return renderLayout(
    <>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        {/* Context Opening Question */}
        <div className="text-center text-caption-sm text-tertiary my-2">
          Yesterday you mentioned preparing for the presentation. How did it feel?
        </div>

        {/* Assistant Bubble */}
        <div className="self-start max-w-[85%] bg-transparent border border-border rounded-2xl rounded-tl-sm p-4 text-primary text-body-md leading-relaxed">
          It sounds like you've been working through some complex state management issues today. Did the walk through the park help clear your mind?
        </div>

        {/* User Bubble */}
        <div className="self-end max-w-[85%] bg-subtle rounded-2xl rounded-tr-sm p-4 text-primary text-body-md leading-relaxed">
          Yeah, stepping away really helped. I realized we can completely strip away the state machine and just rely on React's natural rendering cycle.
        </div>

        {/* Assistant Bubble */}
        <div className="self-start max-w-[85%] bg-transparent border border-border rounded-2xl rounded-tl-sm p-4 text-primary text-body-md leading-relaxed">
          That's a great breakthrough. Simplicity is a discipline. I've drafted a journal note about this architectural decision if you'd like to save it.
        </div>

        {/* Drafted Journal Note Card */}
        <div className="w-full bg-surface border border-border rounded-xl overflow-hidden shadow-sm mt-2">
          <div className="bg-subtle px-4 py-2 border-b border-border flex items-center justify-between">
            <span className="text-label-md font-medium text-primary">Drafted Journal Note</span>
            <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">Requires Confirmation</span>
          </div>
          <div className="p-4">
            <p className="text-body-md text-primary leading-relaxed line-clamp-3">
              {draftContent}
            </p>
            <div className="flex flex-col gap-2 mt-5">
              <button className="w-full bg-primary text-canvas py-2 rounded-lg text-body-md font-medium hover:opacity-90 transition-opacity">
                Save to Today's Entry
              </button>
              <button className="w-full bg-subtle text-primary border border-border py-2 rounded-lg text-body-md font-medium hover:bg-border transition-colors">
                Save as New Separate Entry
              </button>
              <div className="flex gap-2 mt-1">
                <button 
                  onClick={() => setMode("edit")}
                  className="flex-1 text-secondary hover:text-primary text-body-md font-medium py-1.5 transition-colors"
                >
                  Edit Text
                </button>
                <button className="flex-1 text-red-500/70 hover:text-red-500 text-body-md font-medium py-1.5 transition-colors">
                  Discard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-canvas md:bg-surface border-t border-border">
        <div className="flex items-center gap-2 bg-subtle border border-border rounded-full px-4 py-2">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Reflect with Journ..."
            className="flex-1 bg-transparent outline-none text-body-md text-primary placeholder:text-tertiary"
          />
          {!inputText ? (
            <button onClick={() => setMode("voice")} className="w-8 h-8 flex items-center justify-center text-secondary hover:text-primary transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
            </button>
          ) : (
            <button className="w-8 h-8 flex items-center justify-center bg-primary text-canvas rounded-full transition-transform hover:scale-105">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
