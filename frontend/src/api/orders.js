import { requestJson, sendJson } from './client.js';
export const ordersApi = { list: () => requestJson('/api/orders'), paymentOptions: () => requestJson('/api/orders/payment-options'), create: data => sendJson('/api/orders', 'POST', data), updateStatus: (id, status) => sendJson('/api/orders/' + encodeURIComponent(id), 'PATCH', { status }) };
