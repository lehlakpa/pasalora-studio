export async function requestJson(path, options = {}) {
  let response;
  try {
    response = await fetch(path, { cache: 'no-store', ...options });
  } catch {
    throw new Error('Cannot reach the API. Start the backend, then retry.');
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.error || (response.status === 413
      ? 'Image is too large. Choose an image under 8 MB.'
      : `API unavailable (HTTP ${response.status}). Check that the backend is running.`));
  }
  if (!data) throw new Error('The API returned an invalid response. Check the API proxy.');
  return data;
}

export function saveDesign(document) {
  return requestJson('/api/store', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(document)
  });
}
