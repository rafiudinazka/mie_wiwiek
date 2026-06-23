import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('api module', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sets API_BASE to localhost:3001 when on localhost', async () => {
    // jsdom default hostname is 'localhost'
    const { API_BASE } = await import('../api.js');
    expect(API_BASE).toBe('http://localhost:3001');
  });

  it('apiFetch calls fetch with the correct URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('[]'));
    vi.stubGlobal('fetch', mockFetch);

    const { apiFetch } = await import('../api.js');
    await apiFetch('/api/products');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/products'),
      undefined
    );
  });

  it('apiFetch passes options to fetch', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', mockFetch);

    const { apiFetch } = await import('../api.js');
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ test: true }),
    };
    await apiFetch('/api/orders', options);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/orders'),
      options
    );
  });
});
