export async function api(path, opts = {}) {
  const token = localStorage.getItem('rch_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(opts.headers || {})
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const r = await fetch('/api' + path, {
      credentials: 'include',
      ...opts,
      headers,
      signal: opts.signal || controller.signal,
      body: opts.body && JSON.stringify(opts.body)
    });
    clearTimeout(timeoutId);

    if (r.status === 204) return null;
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      if (r.status === 401) {
        localStorage.removeItem('rch_token');
      }
      throw Object.assign(new Error(d.error?.message || 'Request failed'), { status: r.status });
    }
    return d;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw Object.assign(new Error('Backend connection timed out. Please check network or MongoDB settings.'), { status: 408 });
    }
    throw err;
  }
}
