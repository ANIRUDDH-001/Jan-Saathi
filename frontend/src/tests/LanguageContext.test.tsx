import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock motion/react — hoisted by vitest before any imports resolve
vi.mock('motion/react', () => {
  const React = require('react');
  const motionTag = (tag: string) =>
    React.forwardRef((props: any, ref: any) => {
      const { children, initial, animate, exit, transition, whileHover, whileTap, whileInView, variants, layout, layoutId, ...rest } = props;
      return React.createElement(tag, { ...rest, ref }, children);
    });
  return {
    motion: { div: motionTag('div'), span: motionTag('span'), button: motionTag('button'), p: motionTag('p'), img: motionTag('img') },
    AnimatePresence: ({ children }: any) => children,
    useMotionValue: () => ({ get: () => 0, set: () => {} }),
    useTransform: () => 0,
  };
});

import React from 'react';
import { LanguageProvider, useLang } from '../app/context/LanguageContext';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <LanguageProvider>{children}</LanguageProvider>
);

describe('LanguageContext', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('has hi as default language', () => {
    const { result } = renderHook(() => useLang(), { wrapper });
    expect(result.current.lang).toBe('hi');
  });

  it('t() returns Hindi string by default', () => {
    const { result } = renderHook(() => useLang(), { wrapper });
    const val = result.current.t('chat.placeholder');
    expect(val).toBeTruthy();
    expect(typeof val).toBe('string');
  });

  it('all 11 languages have entries for key chat.placeholder', async () => {
    const { result } = renderHook(() => useLang(), { wrapper });
    const LANGS = ['hi', 'en', 'bn', 'ta', 'te', 'gu', 'kn', 'ml', 'mr', 'pa', 'od'] as const;
    for (const lang of LANGS) {
      act(() => { result.current.setLang(lang); });
      // setLang uses a 150ms setTimeout internally
      await act(async () => { await new Promise(r => setTimeout(r, 200)); });
      const val = result.current.t('chat.placeholder');
      expect(val, `Missing translation for lang=${lang} key=chat.placeholder`).toBeTruthy();
    }
  });
});
