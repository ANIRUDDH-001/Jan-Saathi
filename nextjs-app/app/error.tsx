'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background gap-6 p-8">
      <div className="text-6xl">😔</div>
      <h1 className="text-2xl font-semibold text-foreground" style={{ fontFamily: "'Lora', serif" }}>
        Something went wrong
      </h1>
      <p className="text-muted-foreground text-center max-w-md">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 bg-[#FF9933] text-white rounded-xl font-medium hover:opacity-90 transition"
      >
        Try Again
      </button>
    </div>
  );
}
