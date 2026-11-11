"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import { getAuth, onAuthStateChanged, signOut, User } from "firebase/auth";
import { apiClient } from "@/lib/apiClient";

interface WritingHabitsData {
  structure: string;
  depth: string;
  timing: string;
  vocabulary: string;
}

interface HabitMemoryData {
  topics: string[];
  frequency: string;
  tone: string;
  writingHabits?: WritingHabitsData;
  updatedAt: string | null;
}

export default function AccountSettings() {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");
  const [habitMemoryEnabled, setHabitMemoryEnabled] = useState(true);
  const [habitMemory, setHabitMemory] = useState<HabitMemoryData | null>(null);
  const [loadingHabit, setLoadingHabit] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const router = useRouter();

  const applyTheme = (t: "light" | "dark" | "system") => {
    document.documentElement.classList.remove("dark", "light");
    if (t === "dark") document.documentElement.classList.add("dark");
    if (t === "light") document.documentElement.classList.add("light");
  };

  const fetchHabitMemory = async () => {
    setLoadingHabit(true);
    try {
      const res = await apiClient('/api/habit-memory');
      if (res.ok) {
        const data = await res.json();
        setHabitMemory(data);
      }
    } catch (err) {
      console.error('Failed to load habit memory:', err);
    } finally {
      setLoadingHabit(false);
    }
  };

  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser) {
      setUser(auth.currentUser);
    }
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }

    const savedHabit = localStorage.getItem("habitMemoryEnabled");
    if (savedHabit !== null) {
      setHabitMemoryEnabled(savedHabit === "true");
    }

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchHabitMemory();
    }
  }, [user]);

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  };

  const handleHabitToggle = async (enabled: boolean) => {
    setHabitMemoryEnabled(enabled);
    localStorage.setItem("habitMemoryEnabled", String(enabled));
    try {
      await apiClient('/api/account/settings', {
        method: 'PATCH',
        body: JSON.stringify({ habitMemoryEnabled: enabled }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  const isDeleteEnabled = deleteConfirmation === "DELETE";

  const displayName = user?.displayName || user?.email?.split("@")[0] || "User";
  const email = user?.email || "No email connected";
  const initials = (displayName || "U")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase() || "U";
  const isGoogle = user?.providerData?.some((p) => p.providerId === "google.com") ?? true;

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
            
            {/* Profile Card (Identity) */}
            <section className="flex flex-col gap-4">
            <h2 className="text-label-md uppercase tracking-wider text-tertiary font-medium">Profile</h2>
            <div className="bg-surface border border-border rounded-xl p-5 md:p-6 shadow-sm flex flex-col gap-5">
              <div className="flex items-center gap-4">
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={displayName}
                    className="w-16 h-16 rounded-full object-cover border border-border"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl font-medium">
                    {initials}
                  </div>
                )}
                <div>
                  <div className="font-medium text-primary text-body-lg">{displayName}</div>
                  <div className="text-secondary text-body-md">{email}</div>
                </div>
              </div>
              
              <div className="bg-subtle rounded-lg p-3 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"/><path d="M12 22V2"/><path d="M22 12H2"/><path d="M12 2C14.5013 4.73835 15.9228 8.29203 16 12C15.9228 15.708 14.5013 19.2616 12 22C9.49872 19.2616 8.07725 15.708 8 12C8.07725 8.29203 9.49872 4.73835 12 2Z"/></svg>
                  <span className="text-label-md font-medium text-primary">
                    {isGoogle ? "Signed in via Google OAuth" : "Signed in via Firebase Auth"}
                  </span>
                </div>
                <p className="text-caption-sm text-secondary leading-relaxed">
                  Journ only accesses your basic profile (name, email, avatar). No external scopes are requested.
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
                    onClick={() => handleThemeChange(t)}
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
                  onClick={() => handleHabitToggle(!habitMemoryEnabled)}
                  className={`shrink-0 relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-tertiary/20 ${habitMemoryEnabled ? 'bg-primary' : 'bg-tertiary/40'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-surface transition-transform ${habitMemoryEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              
              <div className="pt-4 border-t border-border">
                <label className="flex items-center justify-between cursor-pointer group">
                  <span className="text-body-md text-primary font-medium group-hover:text-secondary transition-colors">Include past entries in AI companion reflections</span>
                  <input type="checkbox" checked={habitMemoryEnabled} onChange={(e) => handleHabitToggle(e.target.checked)} className="w-4 h-4 rounded border-border text-primary focus:ring-primary bg-subtle" />
                </label>
              </div>

              {/* Habit Memory Inspection Area (Read-Only) */}
              <div className="pt-4 border-t border-border flex flex-col gap-3" data-testid="habit-memory-view">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-caption-sm font-semibold uppercase tracking-wider text-tertiary">Current Habit Profile</span>
                    <button 
                      onClick={fetchHabitMemory} 
                      disabled={loadingHabit}
                      title="Refresh habit memory" 
                      aria-label="Refresh habit memory"
                      className="text-tertiary hover:text-primary transition-colors disabled:opacity-50 p-0.5"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={loadingHabit ? 'animate-spin' : ''}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
                    </button>
                  </div>
                  {habitMemory?.updatedAt ? (
                    <span className="text-caption-sm text-tertiary">
                      Last updated {new Date(habitMemory.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  ) : (
                    <span className="text-caption-sm text-tertiary">Not yet analyzed</span>
                  )}
                </div>

                {loadingHabit ? (
                  <div className="py-4 text-caption-sm text-tertiary text-center animate-pulse">
                    Loading habit memory...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-subtle/60 border border-border/80 rounded-lg p-3.5 text-body-md">
                    <div>
                      <span className="text-caption-sm text-tertiary block mb-1">Detected Tone</span>
                      <span className="font-medium text-primary capitalize" data-testid="habit-tone">
                        {habitMemory?.tone || 'Neutral'}
                      </span>
                    </div>
                    <div>
                      <span className="text-caption-sm text-tertiary block mb-1">Journaling Cadence</span>
                      <span className="font-medium text-primary capitalize" data-testid="habit-frequency">
                        {habitMemory?.frequency || 'None yet'}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-caption-sm text-tertiary block mb-1.5">Recurring Topics</span>
                      {habitMemory?.topics && habitMemory.topics.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5" data-testid="habit-topics">
                          {habitMemory.topics.map((topic, i) => (
                            <span key={i} className="px-2.5 py-0.5 rounded-full text-caption-sm bg-surface border border-border text-secondary font-medium">
                              {topic}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-caption-sm text-tertiary italic">No recurring topics detected yet. Topics are analyzed after 2 AM.</span>
                      )}
                    </div>

                    {/* Writing Style & Habits 2x2 Grid */}
                    <div className="sm:col-span-2 pt-3 border-t border-border/60">
                      <span className="text-caption-sm text-tertiary font-semibold uppercase tracking-wider block mb-2">Writing Style & Routine</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div className="bg-surface/80 border border-border/60 rounded-md p-2.5">
                          <span className="text-[11px] text-tertiary block mb-0.5">Formatting Structure</span>
                          <span className="font-medium text-primary text-label-md" data-testid="habit-structure">
                            {habitMemory?.writingHabits?.structure || 'Free-flowing paragraphs'}
                          </span>
                        </div>
                        <div className="bg-surface/80 border border-border/60 rounded-md p-2.5">
                          <span className="text-[11px] text-tertiary block mb-0.5">Typical Depth & Length</span>
                          <span className="font-medium text-primary text-label-md" data-testid="habit-depth">
                            {habitMemory?.writingHabits?.depth || 'Standard reflections'}
                          </span>
                        </div>
                        <div className="bg-surface/80 border border-border/60 rounded-md p-2.5">
                          <span className="text-[11px] text-tertiary block mb-0.5">Routine Timing</span>
                          <span className="font-medium text-primary text-label-md" data-testid="habit-timing">
                            {habitMemory?.writingHabits?.timing || 'Flexible'}
                          </span>
                        </div>
                        <div className="bg-surface/80 border border-border/60 rounded-md p-2.5">
                          <span className="text-[11px] text-tertiary block mb-0.5">Style & Vocabulary</span>
                          <span className="font-medium text-primary text-label-md" data-testid="habit-vocabulary">
                            {habitMemory?.writingHabits?.vocabulary || 'Natural & conversational'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
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
