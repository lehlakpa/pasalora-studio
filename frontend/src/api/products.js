import { requestJson, sendJson } from './client.js';
const url = id => '/api/products/' + encodeURIComponent(id);
export const productsApi = { list: () => requestJson('/api/products'), get: id => requestJson(url(id)), save: (id, data) => sendJson(id ? url(id) : '/api/products', id ? 'PUT' : 'POST', data), remove: id => requestJson(url(id), { method: 'DELETE' }) };
