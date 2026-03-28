import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

beforeEach(() => {
  mockFetch.mockReset();
  localStorage.clear();
});

describe('sendChatMessage', () => {
  it('sends correct payload and returns ChatResponse', async () => {
    const { sendChatMessage } = await import('../app/services/api');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        reply: 'Test reply', state: 'intake', profile: {}, schemes: [],
        gap_value: 0, session_id: 'test', language: 'hi', silence_reset: true
      })
    });
    const result = await sendChatMessage('Hello', 'test-session', 'hi');
    expect(result.state).toBe('intake');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chat'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('includes auth header when token present', async () => {
    localStorage.setItem('js_auth_token', 'test-token');
    const { sendChatMessage } = await import('../app/services/api');
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ state: 'intake', reply: '', profile: {}, schemes: [], gap_value: 0, session_id: '', language: 'hi', silence_reset: true })
    });
    await sendChatMessage('test', 'session', 'hi');
    const call = mockFetch.mock.calls[0];
    const headers = call[1].headers as Record<string, string>;
    expect(headers).toHaveProperty('Authorization', 'Bearer test-token');
  });

  it('throws on non-200 status', async () => {
    const { sendChatMessage } = await import('../app/services/api');
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(sendChatMessage('test', 'sess', 'hi')).rejects.toThrow('chat:500');
  });
});

describe('trackApplication', () => {
  it('returns null on 404', async () => {
    const { trackApplication } = await import('../app/services/api');
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, json: () => Promise.resolve({}) });
    const result = await trackApplication('NONEXISTENT');
    expect(result).toBeNull();
  });
});
