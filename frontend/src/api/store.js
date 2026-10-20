import { requestJson, sendJson } from './client.js';
export const storeApi = { get: () => requestJson('/api/store'), health: () => requestJson('/api/health'), save: document => sendJson('/api/store', 'PUT', document) };
export const saveDesign = storeApi.save;
