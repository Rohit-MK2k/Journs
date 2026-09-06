"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { apiClient } from "@/lib/apiClient";

type ChatMode = "text" | "edit";

type ChatMessage = { id: string; role: 'user' | 'assistant'; text: string; extractedDraft?: string };

export default function ChatCompanion() {
  const [mode, setMode] = useState<ChatMode>("text");
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [draftContent, setDraftContent] = useState("");
  const [destination, setDestination] = useState<"append" | "new">("append");

  useEffect(() => {
    apiClient('/api/chat/session', { method: 'POST' }).catch(() => {});
  }, []);

  const handleConfirmDraft = async (textToSave: string, target: 'today' | 'new') => {
    setMode("text");
    try {
      await apiClient('/api/chat/draft/confirm', {
        method: 'POST',
        body: JSON.stringify({
          draft: { text: textToSave, sourceContext: 'chat' },
          target,
        }),
      });
      setMessages(prev => prev.map(m => m.extractedDraft === textToSave ? { ...m, extractedDraft: undefined } : m));
      setDraftContent("");
    } catch (err) {
      console.error("Failed to save draft", err);
    }
  };

  const handleDiscardDraft = (textToDiscard: string) => {
    setMessages(prev => prev.map(m => m.extractedDraft === textToDiscard ? { ...m, extractedDraft: undefined } : m));
    setDraftContent("");
    setMode("text");
  };

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;
    
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: inputText };
    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsLoading(true);

    try {
      const res = await apiClient('/api/chat/message', {
        method: 'POST',
        body: JSON.stringify({ message: userMsg.text, mode: 'text' })
      });
      
      const contentType = res.headers.get('content-type') || '';
      
      if (contentType.includes('text/event-stream')) {
        setIsLoading(false); // Stop typing indicator
        
        const assistantMsgId = (Date.now() + 1).toString();
        setMessages(prev => [...prev, { id: assistantMsgId, role: 'assistant', text: '' }]);
        
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        let currentText = '';
        
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.trim().slice(6);
                if (dataStr === '[DONE]') continue;
                
                try {
                  const data = JSON.parse(dataStr);
                  const reply = data.replyText || data.message;
                  const rawDraft = data.extractedDraft || data.draft;
                  const draftText = typeof rawDraft === 'string' ? rawDraft : rawDraft?.text || '';
                  if (reply) {
                    currentText += reply;
                    setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, text: currentText } : m));
                  }
                  if (draftText) {
                    setDraftContent(draftText);
                    setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, extractedDraft: draftText } : m));
                  }
                } catch (e) {}
              }
            }
          }
        }
      } else {
        const data = await res.json();
        const reply = data.replyText || data.message || '';
        const rawDraft = data.extractedDraft || data.draft;
        const draftText = typeof rawDraft === 'string' ? rawDraft : rawDraft?.text || '';
        
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          text: reply,
          extractedDraft: draftText || undefined
        };
        
        if (draftText) {
          setDraftContent(draftText);
        }
        
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (error) {
      console.error("Failed to send message", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: 'Sorry, I am having trouble connecting right now. Please try again.',
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

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
              
              <Link href="/" className="text-secondary hover:text-primary p-2" aria-label="Close reflection">
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
            <button className="text-red-500/70 hover:text-red-500 text-body-md font-medium transition-colors" onClick={() => { setDraftContent(""); setMode("text"); }}>
              Discard Draft
            </button>
            <button className="bg-primary text-canvas px-4 py-2 rounded-lg font-medium text-body-md hover:opacity-90 transition-opacity" onClick={() => handleConfirmDraft(draftContent, destination === "append" ? "today" : "new")}>
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

  // Default Text Mode
  return renderLayout(
    <>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6">
        {messages.length === 0 && (
          <div className="text-center text-caption-sm text-tertiary my-2">
            Ask Journ a question or reflect on your day.
          </div>
        )}

        {messages.map(msg => (
          <React.Fragment key={msg.id}>
            {msg.role === 'assistant' ? (
              <div className="self-start max-w-[85%] bg-transparent border border-border rounded-2xl rounded-tl-sm p-4 text-primary text-body-md leading-relaxed whitespace-pre-wrap">
                {msg.text}
              </div>
            ) : (
              <div className="self-end max-w-[85%] bg-subtle rounded-2xl rounded-tr-sm p-4 text-primary text-body-md leading-relaxed whitespace-pre-wrap">
                {msg.text}
              </div>
            )}
            
            {msg.extractedDraft && (
              <div className="w-full bg-surface border border-border rounded-xl overflow-hidden shadow-sm mt-2">
                <div className="bg-subtle px-4 py-2 border-b border-border flex items-center justify-between">
                  <span className="text-label-md font-medium text-primary">Drafted Journal Note</span>
                  <span className="text-[10px] uppercase tracking-wider font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">Requires Confirmation</span>
                </div>
                <div className="p-4">
                  <p className="text-body-md text-primary leading-relaxed line-clamp-3">
                    {msg.extractedDraft}
                  </p>
                  <div className="flex flex-col gap-2 mt-5">
                    <button 
                      onClick={() => handleConfirmDraft(msg.extractedDraft!, 'today')}
                      className="w-full bg-primary text-canvas py-2 rounded-lg text-body-md font-medium hover:opacity-90 transition-opacity"
                    >
                      Save to Today's Entry
                    </button>
                    <button 
                      onClick={() => handleConfirmDraft(msg.extractedDraft!, 'new')}
                      className="w-full bg-subtle text-primary border border-border py-2 rounded-lg text-body-md font-medium hover:bg-border transition-colors"
                    >
                      Save as New Separate Entry
                    </button>
                    <div className="flex gap-2 mt-1">
                      <button 
                        onClick={() => {
                          setDraftContent(msg.extractedDraft!);
                          setMode("edit");
                        }}
                        className="flex-1 text-secondary hover:text-primary text-body-md font-medium py-1.5 transition-colors"
                      >
                        Edit Text
                      </button>
                      <button 
                        onClick={() => handleDiscardDraft(msg.extractedDraft!)}
                        className="flex-1 text-red-500/70 hover:text-red-500 text-body-md font-medium py-1.5 transition-colors"
                      >
                        Discard
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}

        {isLoading && (
          <div className="self-start max-w-[85%] bg-transparent border border-border rounded-2xl rounded-tl-sm p-4 text-primary text-body-md" data-testid="typing-indicator">
            <span className="animate-pulse">...</span>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-canvas md:bg-surface border-t border-border">
        <div className="flex items-center gap-2 bg-subtle border border-border rounded-full px-4 py-2">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={isLoading}
            placeholder="Reflect with Journ..."
            className="flex-1 bg-transparent outline-none text-body-md text-primary placeholder:text-tertiary disabled:opacity-50"
          />
          <button 
            onClick={handleSend} 
            disabled={isLoading || !inputText.trim()} 
            aria-label="Send message"
            className="w-8 h-8 flex items-center justify-center bg-primary text-canvas rounded-full transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </>
  );
}
