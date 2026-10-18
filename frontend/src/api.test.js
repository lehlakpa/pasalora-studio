import test from 'node:test';
import assert from 'node:assert/strict';
import { requestJson, saveDesign } from './api.js';
import { makeDoc, presets } from './data.js';

test('storefront API bypasses cached data', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (path, options) => {
      assert.equal(path, '/api/store');
      assert.equal(options.cache, 'no-store');
      return Response.json({ document: { settings: { storeName: 'Saved store' } } });
    };
    assert.equal((await requestJson('/api/store')).document.settings.storeName, 'Saved store');
  } finally { globalThis.fetch = original; }
});

test('database and proxy failures provide readable errors', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async () => Response.json({ error: 'Database is not connected' }, { status: 503 });
    await assert.rejects(requestJson('/api/store'), /Database is not connected/);
    globalThis.fetch = async () => new Response('<html>Bad gateway</html>', { status: 502 });
    await assert.rejects(requestJson('/api/uploads'), /API unavailable.*502/);
    globalThis.fetch = async () => { throw new TypeError('Failed to fetch'); };
    await assert.rejects(requestJson('/api/uploads'), /Start the backend/);
  } finally { globalThis.fetch = original; }
});

test('saving preserves Cloudinary image URLs in the document', async () => {
  const original = globalThis.fetch;
  try {
    const document = makeDoc('fashion');
    document.products[0].image = 'https://res.cloudinary.com/example/image/upload/product.png';
    globalThis.fetch = async (path, options) => {
      assert.equal(path, '/api/store');
      assert.equal(options.method, 'PUT');
      assert.deepEqual(JSON.parse(options.body), document);
      return Response.json({ saved: true });
    };
    assert.equal((await saveDesign(document)).saved, true);
  } finally { globalThis.fetch = original; }
});

test('only one e-commerce template remains; old template names use it', () => {
  assert.equal(Object.keys(presets).length, 1);
  assert.equal(presets.fashion.name, 'E-commerce');
  assert.equal(makeDoc('tech').template, 'fashion');
});
