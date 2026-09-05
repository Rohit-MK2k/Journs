"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
      router.push("/");
    } catch (error) {
      console.error("Login failed:", error);
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6 bg-canvas min-h-screen">
      <div className="w-full max-w-[420px] bg-surface rounded-xl p-8 md:p-10 shadow-sm border border-border flex flex-col items-center text-center">
        {/* Header Label */}
        <div className="text-[11px] font-medium tracking-widest text-tertiary uppercase mb-6">
          • Editorial Journaling •
        </div>
        
        {/* Brand Mark */}
        <h1 className="font-serif text-display-lg font-medium tracking-tight text-primary mb-2 text-4xl">
          Journ
        </h1>
        
        {/* Statement */}
        <p className="text-secondary text-body-md mb-8">
          A quiet space for your thoughts.
        </p>
        
        {/* OAuth Action Button */}
        <button 
          onClick={handleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-surface hover:bg-subtle transition-colors border border-border rounded-lg py-3 px-4 mb-8 disabled:opacity-50 disabled:cursor-wait"
        >
          {/* Google 4-color "G" glyph (SVG) */}
          <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.16v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.16C1.43 8.55 1 10.22 1 12s.43 3.45 1.16 4.93l3.68-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.16 7.07l3.68 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="font-medium text-primary text-body-md">{loading ? "Authenticating..." : "Continue with Google"}</span>
        </button>
        
        {/* Trust Assurance Block */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <div className="flex items-center gap-1.5 text-primary text-label-md font-medium">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
            Private by design
          </div>
          <p className="text-secondary text-caption-sm leading-relaxed max-w-[280px]">
            Tied securely to your Google account with end-to-end user isolation. No unsolicited notifications, feeds, or profiling.
          </p>
        </div>
        
        {/* Philosophical Anchor */}
        <div className="text-tertiary italic text-caption-sm font-serif">
          "Quiet the mind, and the soul will speak."
        </div>
      </div>
      
      {/* Footer Bar */}
      <footer className="w-full max-w-[420px] flex justify-between items-center mt-8 text-tertiary text-caption-sm px-2">
        <div>Journ System</div>
        <div>Privacy · Terms</div>
      </footer>
    </main>
  );
}
