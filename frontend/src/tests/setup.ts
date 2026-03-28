import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ── Browser API polyfills for jsdom ──────────────────────────────────────────

// Mock AudioContext
(globalThis as any).AudioContext = class {
  createBufferSource() { return { connect: vi.fn(), start: vi.fn(), onended: null, buffer: null }; }
  decodeAudioData(buf: ArrayBuffer) { return Promise.resolve(buf as any); }
  destination = {};
  close() { return Promise.resolve(); }
  resume() { return Promise.resolve(); }
  suspend() { return Promise.resolve(); }
} as any;

// Mock MediaRecorder
(globalThis as any).MediaRecorder = class {
  ondataavailable: any; onstop: any;
  start() {} stop() { this.onstop?.(); }
  static isTypeSupported() { return true; }
} as any;

// Mock navigator.mediaDevices
Object.defineProperty(globalThis.navigator, 'mediaDevices', {
  value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop: vi.fn() }] }) },
  configurable: true,
});

// Mock URL methods
(globalThis as any).URL.createObjectURL = vi.fn();
(globalThis as any).URL.revokeObjectURL = vi.fn();
