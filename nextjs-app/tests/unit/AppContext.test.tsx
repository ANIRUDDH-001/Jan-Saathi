import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AppProvider, useApp } from '@/context/AppContext';

// Mock the uuid utility
vi.mock('@/utils/uuid', () => ({
  v4Fallback: () => 'test-uuid-1234',
}));

// Mock next-auth
vi.mock('next-auth/react', () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSession: () => ({ data: null, status: 'unauthenticated' }),
}));

// Test consumer component
const TestConsumer = () => {
  const { profile, mergeProfile, chatState, setChatState, sessionId, currentLanguage, setLanguage, gapValue, setGapValue, schemes, setSchemes, isLoggedIn, logout, resetChatSession, addMessage, messages } = useApp();
  return (
    <div>
      <div data-testid="state">{(profile.state as string) || 'empty'}</div>
      <div data-testid="chatState">{chatState}</div>
      <div data-testid="sessionId">{sessionId}</div>
      <div data-testid="language">{currentLanguage}</div>
      <div data-testid="gapValue">{gapValue}</div>
      <div data-testid="schemeCount">{schemes.length}</div>
      <div data-testid="isLoggedIn">{isLoggedIn ? 'yes' : 'no'}</div>
      <div data-testid="messageCount">{messages.length}</div>
      <button data-testid="merge-btn" onClick={() => mergeProfile({ state: 'Maharashtra' })}>Merge</button>
      <button data-testid="state-btn" onClick={() => setChatState('match')}>Match</button>
      <button data-testid="lang-btn" onClick={() => setLanguage('bn')}>Bengali</button>
      <button data-testid="gap-btn" onClick={() => setGapValue(6000)}>Gap</button>
      <button data-testid="logout-btn" onClick={logout}>Logout</button>
      <button data-testid="reset-btn" onClick={resetChatSession}>Reset</button>
      <button data-testid="msg-btn" onClick={() => addMessage({ id: '1', role: 'user', text: 'hello' })}>Msg</button>
    </div>
  );
};

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <AppProvider>{children}</AppProvider>
);

describe('AppContext', () => {
  it('starts with empty profile', () => {
    render(<TestConsumer />, { wrapper: Wrapper });
    expect(screen.getByTestId('state').textContent).toBe('empty');
  });

  it('initial chatState is intake', () => {
    render(<TestConsumer />, { wrapper: Wrapper });
    expect(screen.getByTestId('chatState').textContent).toBe('intake');
  });

  it('generates a session ID', () => {
    render(<TestConsumer />, { wrapper: Wrapper });
    const sessionId = screen.getByTestId('sessionId').textContent;
    expect(sessionId).toBeTruthy();
    expect(sessionId!.length).toBeGreaterThan(5);
  });

  it('default language is Hindi', () => {
    render(<TestConsumer />, { wrapper: Wrapper });
    expect(screen.getByTestId('language').textContent).toBe('hi');
  });

  it('mergeProfile updates state', () => {
    render(<TestConsumer />, { wrapper: Wrapper });
    fireEvent.click(screen.getByTestId('merge-btn'));
    expect(screen.getByTestId('state').textContent).toBe('Maharashtra');
  });

  it('setChatState transitions correctly', () => {
    render(<TestConsumer />, { wrapper: Wrapper });
    fireEvent.click(screen.getByTestId('state-btn'));
    expect(screen.getByTestId('chatState').textContent).toBe('match');
  });

  it('setLanguage updates current language', () => {
    render(<TestConsumer />, { wrapper: Wrapper });
    fireEvent.click(screen.getByTestId('lang-btn'));
    expect(screen.getByTestId('language').textContent).toBe('bn');
  });

  it('gap value starts at 0 and updates', () => {
    render(<TestConsumer />, { wrapper: Wrapper });
    expect(screen.getByTestId('gapValue').textContent).toBe('0');
    fireEvent.click(screen.getByTestId('gap-btn'));
    expect(screen.getByTestId('gapValue').textContent).toBe('6000');
  });

  it('starts not logged in', () => {
    render(<TestConsumer />, { wrapper: Wrapper });
    expect(screen.getByTestId('isLoggedIn').textContent).toBe('no');
  });

  it('addMessage appends to messages', () => {
    render(<TestConsumer />, { wrapper: Wrapper });
    expect(screen.getByTestId('messageCount').textContent).toBe('0');
    fireEvent.click(screen.getByTestId('msg-btn'));
    expect(screen.getByTestId('messageCount').textContent).toBe('1');
  });

  it('resetChatSession clears messages and profile', () => {
    render(<TestConsumer />, { wrapper: Wrapper });
    // Add data first
    fireEvent.click(screen.getByTestId('merge-btn'));
    fireEvent.click(screen.getByTestId('msg-btn'));
    expect(screen.getByTestId('state').textContent).toBe('Maharashtra');
    expect(screen.getByTestId('messageCount').textContent).toBe('1');
    // Reset
    fireEvent.click(screen.getByTestId('reset-btn'));
    expect(screen.getByTestId('state').textContent).toBe('empty');
    expect(screen.getByTestId('messageCount').textContent).toBe('0');
    expect(screen.getByTestId('chatState').textContent).toBe('intake');
  });
});
