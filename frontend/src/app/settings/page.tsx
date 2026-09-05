"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { getAuth, signOut } from "firebase/auth";
import { apiClient } from "@/lib/apiClient";

export default function AccountSettings() {
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [habitMemoryEnabled, setHabitMemoryEnabled] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const router = useRouter();

  const isDeleteEnabled = deleteConfirmation === "DELETE";

  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      router.push("/login");
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (isDeleteEnabled) {
      try {
        await apiClient('/api/account', { method: 'DELETE' });
        await signOut(getAuth());
        router.push("/login");
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <AuthGuard>
      <div className="flex-1 flex flex-col items-center min-h-screen bg-canvas">
        <div className="w-full max-w-[680px] px-4 md:px-8 flex flex-col flex-1 pb-24">
          
          {/* Header */}
          <header className="py-6 border-b border-border sticky top-0 bg-canvas/90 backdrop-blur z-10">
            <Link href="/" className="inline-flex items-center gap-2 text-secondary hover:text-primary transition-colors text-body-md font-medium mb-4">
              ← Back to Journal
            </Link>
            <h1 className="font-serif text-display-lg font-medium text-primary tracking-tight">Account & Settings</h1>
            <p className="text-secondary text-body-md mt-1">Manage your journal identity, preferences, and data privacy.</p>
          </header>

          <div className="flex flex-col gap-10 mt-8">
            
            {/* Profile Card (Google Identity) */}
            <section className="flex flex-col gap-4">
            <h2 className="text-label-md uppercase tracking-wider text-tertiary font-medium">Profile</h2>
            <div className="bg-surface border border-border rounded-xl p-5 md:p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-medium">
                  AC
                </div>
                <div>
                  <div className="font-medium text-primary text-body-lg">Alex Chen</div>
                  <div className="text-secondary text-body-md">alex.chen@gmail.com</div>
                </div>
              </div>
              
              <div className="bg-subtle rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"/><path d="M12 22V2"/><path d="M22 12H2"/><path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z"/></svg>
                  <span className="text-label-md font-medium text-primary">Signed in via Google OAuth</span>
                </div>
                <p className="text-caption-sm text-secondary leading-relaxed">
                  Journ only accesses your basic profile (name, email, avatar). No Google Drive, Calendar, or contacts scopes are requested.
                </p>
              </div>
            </div>
          </section>

          {/* Preferences */}
          <section className="flex flex-col gap-4">
            <h2 className="text-label-md uppercase tracking-wider text-tertiary font-medium">Preferences</h2>
            
            {/* Canvas Theme Selector */}
            <div className="bg-surface border border-border rounded-xl p-5 md:p-6 shadow-sm flex flex-col gap-4">
              <div>
                <div className="font-medium text-primary text-body-md">Canvas Theme</div>
                <p className="text-caption-sm text-secondary mt-1">Editorial reading contrast designed to soothe eye strain.</p>
              </div>
              
              <div className="flex bg-subtle p-1 rounded-lg border border-border">
                {(["light", "dark", "system"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`flex-1 py-2 rounded-md text-label-md capitalize transition-colors ${
                      theme === t 
                        ? "bg-surface text-primary shadow-sm border border-border/50" 
                        : "text-secondary hover:text-primary"
                    }`}
                  >
                    {t === "light" ? "Light (Warm Paper)" : t === "dark" ? "Dark (Charcoal)" : "System"}
                  </button>
                ))}
              </div>
            </div>

            {/* Habit Memory */}
            <div className="bg-surface border border-border rounded-xl p-5 md:p-6 shadow-sm flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-primary text-body-md">Habit Memory & Reflection</span>
                    <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide uppercase">Local Vector State</span>
                  </div>
                  <p className="text-caption-sm text-secondary leading-relaxed">
                    Your AI companion maintains a lightweight habit memory (&lt;2000 tokens) updated silently in the background after 2 AM while you sleep. It learns your tone and topics to offer timely prompts without reading your raw entries on every turn.
                  </p>
                </div>
                
                {/* Custom Toggle Switch */}
                <button 
                  onClick={() => setHabitMemoryEnabled(!habitMemoryEnabled)}
                  className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-tertiary/20 ${habitMemoryEnabled ? 'bg-primary' : 'bg-tertiary/40'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-surface transition-transform ${habitMemoryEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              
              <div className="pt-4 border-t border-border">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-body-md text-primary font-medium group-hover:text-secondary transition-colors">Include past entries in AI companion reflections</span>
                  <input type="checkbox" checked={habitMemoryEnabled} onChange={() => setHabitMemoryEnabled(!habitMemoryEnabled)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-subtle" />
                </label>
              </div>
            </div>
          </section>

          {/* Account Security & Session */}
          <section className="flex flex-col gap-4">
            <h2 className="text-label-md uppercase tracking-wider text-tertiary font-medium">Session & Security</h2>
            
            <div className="bg-surface border border-border rounded-xl p-5 md:p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="font-medium text-primary text-body-md">Current Session</div>
                <p className="text-caption-sm text-secondary mt-1">
                  Signed in on this browser instance. Entries are continuously autosaved to your encrypted remote vault.
                </p>
              </div>
              <button onClick={handleLogout} className="whitespace-nowrap px-4 py-2 border border-border bg-subtle hover:bg-border text-primary rounded-lg text-body-md font-medium transition-colors">
                Log Out
              </button>
            </div>

            {/* Danger Zone */}
            <div className="border border-red-500/30 bg-red-500/5 rounded-xl p-5 md:p-6 flex flex-col gap-4 mt-4">
              <h3 className="font-medium text-red-600 dark:text-red-500 text-body-lg">Delete Account & All Data</h3>
              <p className="text-body-md text-red-700/80 dark:text-red-400/80 leading-relaxed">
                Permanently deletes your account, all journal entries, audio attachments, chat transcripts, and habit memory from Firestore and Vertex AI vector indices. <strong className="font-semibold">This action is irreversible.</strong>
              </p>
              
              <div className="flex flex-col gap-3 mt-2">
                <label className="text-caption-sm font-medium text-red-700/80 dark:text-red-400/80">
                  Type DELETE below to confirm permanent deletion
                </label>
                <div className="flex flex-col md:flex-row gap-3">
                  <input 
                    type="text" 
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="DELETE"
                    className="flex-1 bg-surface border border-red-500/30 rounded-lg px-4 py-2 text-primary focus:outline-none focus:ring-2 focus:ring-red-500/30"
                  />
                  <button 
                    onClick={handleDelete}
                    disabled={!isDeleteEnabled}
                    className={`px-6 py-2 rounded-lg font-medium text-body-md transition-all ${
                      isDeleteEnabled 
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-md' 
                        : 'bg-red-500/20 text-red-500/50 cursor-not-allowed'
                    }`}
                  >
                    Permanently Wipe All Data
                  </button>
                </div>
              </div>
            </div>
          </section>

        </div>
        
        {/* System Footer */}
        <footer className="mt-16 text-center text-caption-sm text-tertiary">
          Journ Sanctuary Engine • Encrypted Personal Archive • Version 2.4.1
        </footer>
      </div>
    </div>
    </AuthGuard>
  );
}
