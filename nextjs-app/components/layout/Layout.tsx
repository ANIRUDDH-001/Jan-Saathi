'use client';

import React from 'react';
import { TopNav } from './TopNav';
import { Footer } from './Footer';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
