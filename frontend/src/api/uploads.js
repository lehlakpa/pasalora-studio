import { requestJson } from './client.js';
export function uploadImage(file) { const body = new FormData(); body.append('image', file); return requestJson('/api/uploads', { method: 'POST', body }); }
