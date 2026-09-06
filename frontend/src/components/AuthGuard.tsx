"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (typeof auth?.onAuthStateChanged === 'function') {
      const unsubscribe = auth.onAuthStateChanged((user: any) => {
        if (!user) {
          router.push('/login');
        } else {
          setAuthorized(true);
        }
      });
      return () => unsubscribe();
    } else {
      if (!auth?.currentUser) {
        router.push('/login');
      } else {
        setAuthorized(true);
      }
    }
  }, [router]);

  // Prevent flash of protected content
  if (!authorized) return null;
  return <>{children}</>;
}
