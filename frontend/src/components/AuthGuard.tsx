"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth } from 'firebase/auth';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const auth = getAuth();
    if (!auth.currentUser) {
      router.push('/login');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  // Prevent flash of protected content
  if (!authorized) return null;
  return <>{children}</>;
}
