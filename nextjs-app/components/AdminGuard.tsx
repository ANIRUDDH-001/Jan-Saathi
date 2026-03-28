'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoggedIn } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn || !isAdmin) {
      router.replace('/');
    }
  }, [isAdmin, isLoggedIn, router]);

  if (!isAdmin) return null;
  return <>{children}</>;
}