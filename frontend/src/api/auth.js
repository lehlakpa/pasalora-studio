import { requestJson, sendJson } from './client.js';
export const authApi = { status: () => requestJson('/api/auth/status'), me: () => requestJson('/api/auth/me'), login: data => sendJson('/api/auth/login', 'POST', data), register: data => sendJson('/api/auth/register', 'POST', data), logout: () => requestJson('/api/auth/logout', { method: 'POST' }) };
