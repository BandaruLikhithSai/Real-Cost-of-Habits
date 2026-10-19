export async function api(path, opts = {}) {
  const token = localStorage.getItem('rch_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(opts.headers || {})
  };

  const r = await fetch('/api' + path, {
    credentials: 'include',
    ...opts,
    headers,
    body: opts.body && JSON.stringify(opts.body)
  });

  if (r.status === 204) return null;
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    if (r.status === 401) {
      localStorage.removeItem('rch_token');
    }
    throw Object.assign(new Error(d.error?.message || 'Request failed'), { status: r.status });
  }
  return d;
}
