import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// ── ALL mocks declared here — hoisted by vitest before imports resolve ──────

// 1. Mock motion/react (used by ChatProgressBar, GapCard, RupeeDisplay)
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

// 2. Mock lucide-react icons (used by ChatProgressBar, GapCard)
vi.mock('lucide-react', () => {
  const React = require('react');
  const icon = (name: string) => (props: any) =>
    React.createElement('span', { 'data-testid': `icon-${name}` });
  return {
    ChevronRight: icon('ChevronRight'),
    TrendingUp: icon('TrendingUp'),
  };
});

// 3. Mock LanguageContext (used by ChatProgressBar, GapCard)
vi.mock('../app/context/LanguageContext', () => ({
  LanguageProvider: ({ children }: any) => children,
  useLang: () => ({
    lang: 'hi' as const,
    setLang: () => {},
    t: (key: string, vars?: Record<string, any>) => {
      const map: Record<string, string> = {
        'gap.your_benefits': 'आपके कुल लाभ',
        'gap.across': `${vars?.scheme_count || 0} योजनाओं में`,
        'gap.cta': 'सभी योजनाएं देखें',
      };
      return map[key] || key;
    },
  }),
}));

// ── Static imports — all dependencies are mocked above ──────────────────────
import React from 'react';
import { ChatProgressBar } from '../app/components/ChatProgressBar';
import { VedAvatar } from '../app/components/VedAvatar';
import { GapCard } from '../app/components/GapCard';

describe('ChatProgressBar', () => {
  it('renders without crashing', () => {
    const { container } = render(<ChatProgressBar activeStep={0} profileProgress={0} />);
    expect(container).toBeTruthy();
  });

  it('renders at step 2', () => {
    const { container } = render(<ChatProgressBar activeStep={2} />);
    expect(container).toBeTruthy();
  });
});

describe('VedAvatar', () => {
  it('renders without crashing', () => {
    render(<VedAvatar size={100} />);
    expect(document.body).toBeTruthy();
  });

  it('renders with speaking=true', () => {
    render(<VedAvatar size={100} speaking={true} />);
    expect(document.body).toBeTruthy();
  });
});

describe('GapCard', () => {
  it('displays formatted rupee amount', () => {
    render(<GapCard gapValue={62000} schemeCount={3} onViewSchemes={() => {}} />);
    const text = screen.getByText(/62,000/);
    expect(text).toBeTruthy();
  });
});
