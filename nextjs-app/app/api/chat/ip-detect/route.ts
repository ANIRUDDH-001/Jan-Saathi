import { NextResponse } from 'next/server';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'http://localhost:8000';

export async function POST() {
  try {
    const response = await fetch(`${API_BASE}/api/chat/ip-detect`, {
      method: 'POST',
      cache: 'no-store',
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      {
        state: null,
        city: null,
        detected: false,
        error: error instanceof Error ? error.message : 'unknown_error',
      },
      { status: 200 }
    );
  }
}
