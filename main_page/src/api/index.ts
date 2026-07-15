// main_page/src/api/index.ts
const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

async function request(path: string, opts: RequestInit = {}) {
  const url = `${BASE}${path}`;
  console.log('[API request]', opts.method || 'GET', url, opts.body ? (() => {
    try { return JSON.parse(String(opts.body)) } catch { return String(opts.body) }
  })() : undefined);
  try {
    const res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(opts.headers || {}),
      },
      ...opts,
    });
    console.log('[API response status]', res.status, res.statusText, url);
    if (!res.ok) {
      const text = await res.text();
      console.error('[API response error body]', text);
      throw new Error(`${res.status} ${res.statusText}: ${text}`);
    }
    if (res.status === 204) return null;
    const json = await res.json();
    console.log('[API response json]', url, json);
    return json;
  } catch (err) {
    console.error('[API fetch error]', err, url);
    throw err;
  }
}

export const api = {
  health: () => request('/health', { method: 'GET' }),
  chat: (message: string, session_id?: string) =>
    request('/chat', { method: 'POST', body: JSON.stringify({ message, session_id }) }),

  getPosts: (category?: string, page = 1, size = 10) =>
    request(`/posts?category=${encodeURIComponent(category||'')}&page=${page}&size=${size}`),

  getPost: (id: string|number) => request(`/posts/${id}`, { method: 'GET' }),

  // createPost: use explicit fetch POST to guarantee method+headers+body are applied
  createPost: async (payload: any) => {
    const url = `${BASE}/posts`;
    console.log('[API createPost] POST', url, payload);
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    console.log('[API createPost status]', res.status, res.statusText);
    if (!res.ok) {
      const text = await res.text();
      console.error('[API createPost error body]', text);
      throw new Error(`${res.status} ${res.statusText}: ${text}`);
    }
    if (res.status === 204) return null;
    const json = await res.json();
    console.log('[API createPost json]', json);
    return json;
  },

  updatePost: (id: string|number, payload: any) =>
    request(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),

  deletePost: (id: string|number, password: string) =>
    request(`/posts/${id}`, { method: 'DELETE', body: JSON.stringify({ password }) }),
};