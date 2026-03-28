'use client';

import { SessionProvider } from 'next-auth/react';
import { LanguageProvider } from '@/context/LanguageContext';
import { AppProvider } from '@/context/AppContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <AppProvider>
          {children}
        </AppProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}
