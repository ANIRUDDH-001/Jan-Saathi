import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// We need to mock localStorage before importing the module
Object.defineProperty(globalThis, 'window', {
  value: globalThis,
  writable: true,
});

describe('API utilities', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('sendChatMessage', () => {
    it('sends correct payload and returns parsed response', async () => {
      const { sendChatMessage } = await import('@/lib/api');
      const mockResponse = {
        reply: 'Namaste!',
        state: 'intake',
        profile: {},
        schemes: [],
        gap_value: 0,
        session_id: 'test-session',
        language: 'hi',
        silence_reset: false,
      };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await sendChatMessage('hello', 'session-123', 'hi');
      expect(result.reply).toBe('Namaste!');
      expect(result.state).toBe('intake');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('throws on non-ok response', async () => {
      const { sendChatMessage } = await import('@/lib/api');
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
      await expect(sendChatMessage('hello', 's1', 'hi')).rejects.toThrow('chat:500');
    });
  });

  describe('synthesizeSpeech', () => {
    it('returns audio base64 on success', async () => {
      const { synthesizeSpeech } = await import('@/lib/api');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ audio_b64: 'AAAA==' }),
      });
      const result = await synthesizeSpeech('namaste', 'hi');
      expect(result).toBe('AAAA==');
    });

    it('returns empty string on failure', async () => {
      const { synthesizeSpeech } = await import('@/lib/api');
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
      const result = await synthesizeSpeech('fail', 'hi');
      expect(result).toBe('');
    });
  });

  describe('detectLocation', () => {
    it('returns detected location on success', async () => {
      const { detectLocation } = await import('@/lib/api');
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ state: 'uttar_pradesh', city: 'Varanasi', detected: true }),
      });
      const result = await detectLocation();
      expect(result.detected).toBe(true);
      expect(result.state).toBe('uttar_pradesh');
    });

    it('returns fallback on network error', async () => {
      const { detectLocation } = await import('@/lib/api');
      mockFetch.mockRejectedValueOnce(new Error('network fail'));
      const result = await detectLocation();
      expect(result.detected).toBe(false);
      expect(result.state).toBeNull();
    });
  });

  describe('trackApplication', () => {
    it('returns null for 404', async () => {
      const { trackApplication } = await import('@/lib/api');
      mockFetch.mockResolvedValueOnce({ status: 404 });
      const result = await trackApplication('NONEXISTENT');
      expect(result).toBeNull();
    });

    it('returns application data on success', async () => {
      const { trackApplication } = await import('@/lib/api');
      const mockApp = { reference_number: 'JAN-2026-00001', status: 'submitted' };
      mockFetch.mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve(mockApp),
      });
      const result = await trackApplication('JAN-2026-00001');
      expect(result.reference_number).toBe('JAN-2026-00001');
    });
  });
});
