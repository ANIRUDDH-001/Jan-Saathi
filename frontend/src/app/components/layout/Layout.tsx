import React from 'react';
import { Outlet } from 'react-router';
import { TopNav } from './TopNav';
import { Footer } from './Footer';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
