/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/display-name */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, act } from '@testing-library/react';
import { VoiceWaveform } from '@/components/VoiceWaveform';

// Mock motion from 'motion/react'
vi.mock('motion/react', () => ({
  motion: {
    div: React.forwardRef(({ animate, transition, style, ...props }: Record<string, unknown>, ref: React.Ref<HTMLDivElement>) =>
      React.createElement('div', { ...props, ref, style: style as React.CSSProperties, 'data-animate': JSON.stringify(animate) })
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('VoiceWaveform', () => {
  it('renders without crashing', () => {
    const { container } = render(<VoiceWaveform />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders the correct number of bars', () => {
    const { container } = render(<VoiceWaveform barCount={15} />);
    const flexContainer = container.firstChild as HTMLElement;
    expect(flexContainer.children.length).toBe(15);
  });

  it('renders with default barCount of 20', () => {
    const { container } = render(<VoiceWaveform />);
    const flexContainer = container.firstChild as HTMLElement;
    expect(flexContainer.children.length).toBe(20);
  });

  it('accepts isActive prop without crashing', () => {
    const { container } = render(<VoiceWaveform isActive={true} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('accepts null analyserNode', () => {
    const { container } = render(<VoiceWaveform analyserNode={null} isActive={false} />);
    expect(container.firstChild).toBeTruthy();
  });
});
