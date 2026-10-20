let refreshPromise;
export async function requestJson(path, options = {}, retried = false) {
  let response;
  try {
    response = await fetch(path, { cache: 'no-store', credentials: 'same-origin', ...options, headers: { 'X-Studio-Request': '1', ...options.headers } });
  } catch {
    throw new Error('Cannot reach the API. Start the backend, then retry.');
  }
  const data = await response.json().catch(() => null);
  if (response.status === 401 && !retried && (!path.startsWith('/api/auth/') || path === '/api/auth/me')) {
    if (!refreshPromise) refreshPromise = requestJson('/api/auth/refresh', { method: 'POST' }, true).finally(() => { refreshPromise = null; });
    let refreshed = false;
    try { await refreshPromise; refreshed = true; } catch {
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('studio:unauthorized'));
    }
    if (refreshed) return requestJson(path, options, true);
  }
  if (!response.ok) {
    const error = new Error(data?.error || (response.status === 413
      ? 'Image is too large. Choose an image under 8 MB.'
      : `API unavailable (HTTP ${response.status}). Check that the backend is running.`));
    error.status = response.status;
    throw error;
  }
  if (!data) throw new Error('The API returned an invalid response. Check the API proxy.');
  return data;
}


export function sendJson(path, method, data) { return requestJson(path, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); }
