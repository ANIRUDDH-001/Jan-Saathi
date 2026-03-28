import React from 'react';
import { RouterProvider } from 'react-router';
import { router } from './routes';
import { LanguageProvider } from './context/LanguageContext';
import { AppProvider } from './context/AppContext';
import { Toaster } from 'sonner';

// Main App Component
export default function App() {
  return (
    <LanguageProvider>
      <AppProvider>
        <RouterProvider router={router} />
        <Toaster richColors position="top-center" />
      </AppProvider>
    </LanguageProvider>
  );
}