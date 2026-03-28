import { renderHook, act } from '@testing-library/react';
import { AppProvider, useApp } from '../app/context/AppContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';

// Wrapper with all providers
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

describe('AppContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('generates and persists session_id', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const sid = result.current.sessionId;
    expect(sid).toBeTruthy();
    expect(localStorage.getItem('js_session_id')).toBe(sid);
  });

  it('mergeProfile merges without losing existing fields', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => {
      result.current.setProfile({ state: 'up', age: 45 });
    });
    act(() => {
      result.current.mergeProfile({ occupation_subtype: 'crop_farmer' });
    });
    expect(result.current.profile).toEqual({
      state: 'up', age: 45, occupation_subtype: 'crop_farmer'
    });
  });

  it('updateLastInputTime updates timestamp', async () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const before = result.current.lastInputTime;
    await new Promise(r => setTimeout(r, 10));
    act(() => {
      result.current.updateLastInputTime();
    });
    expect(result.current.lastInputTime).toBeGreaterThan(before);
  });

  it('loginWithToken persists to localStorage', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    const user = { id:'1', email:'a@b.com', name:'Test', role:'citizen' as 'citizen' };
    act(() => {
      result.current.loginWithToken('jwt-token', user);
    });
    expect(result.current.isLoggedIn).toBe(true);
    expect(localStorage.getItem('js_auth_token')).toBe('jwt-token');
    expect(result.current.user).toEqual(user);
  });

  it('addApplication saves to localStorage', () => {
    const { result } = renderHook(() => useApp(), { wrapper });
    act(() => {
      result.current.addApplication('JAN-2026-00001', { status: 'submitted' });
    });
    const saved = JSON.parse(localStorage.getItem('js_applications') || '{}');
    expect(saved['JAN-2026-00001']).toEqual({ status: 'submitted' });
  });
});
