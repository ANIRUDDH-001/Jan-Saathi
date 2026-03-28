/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react/display-name */
import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';

// Mock motion from 'motion/react'
vi.mock('motion/react', () => ({
  motion: {
    div: React.forwardRef(({ animate, transition, style, ...props }: Record<string, unknown>, ref: React.Ref<HTMLDivElement>) =>
      React.createElement('div', { ...props, ref, style: style as React.CSSProperties })
    ),
    ellipse: (props: Record<string, unknown>) =>
      React.createElement('ellipse', props),
    g: ({ children, ...props }: Record<string, unknown>) =>
      React.createElement('g', props, children as React.ReactNode),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// We need to import after mocking
import { ShubhAvatar, ShubhAvatarSmall, ShubhAvatarProfile } from '@/components/ShubhAvatar';

describe('ShubhAvatar', () => {
  it('renders without crashing', () => {
    const { container } = render(<ShubhAvatar />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders SVG element', () => {
    const { container } = render(<ShubhAvatar />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('uses correct viewBox', () => {
    const { container } = render(<ShubhAvatar />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBe('0 0 380 422');
  });

  it('does not use canvas (no WebGL/Three.js)', () => {
    const { container } = render(<ShubhAvatar />);
    expect(container.querySelector('canvas')).toBeNull();
  });

  it('renders with speaking prop', () => {
    const { container } = render(<ShubhAvatar speaking={true} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with isTalking alias', () => {
    const { container } = render(<ShubhAvatar isTalking={true} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with processing prop', () => {
    const { container } = render(<ShubhAvatar processing={true} />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with showLabel prop', () => {
    const { container } = render(<ShubhAvatar showLabel={true} />);
    // Should show शुभ label
    expect(container.textContent).toContain('शुभ');
  });

  it('renders image element with avatar src', () => {
    const { container } = render(<ShubhAvatar />);
    const image = container.querySelector('image');
    expect(image).toBeTruthy();
    expect(image?.getAttribute('href')).toContain('shubh_avatar');
  });
});

describe('ShubhAvatarSmall', () => {
  it('renders without crashing', () => {
    const { container } = render(<ShubhAvatarSmall />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with speaking prop', () => {
    const { container } = render(<ShubhAvatarSmall speaking={true} />);
    expect(container.firstChild).toBeTruthy();
  });
});

describe('ShubhAvatarProfile', () => {
  it('renders without crashing', () => {
    const { container } = render(<ShubhAvatarProfile />);
    expect(container.firstChild).toBeTruthy();
  });
});
