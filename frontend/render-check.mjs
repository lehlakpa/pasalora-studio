import { build } from 'esbuild';
import { createRequire } from 'node:module';
import Module from 'node:module';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { makeDoc } from './src/data.js';

const output = await build({ entryPoints: [resolve('src/App.jsx')], bundle: true, write: false, platform: 'node', format: 'cjs', external: ['react'] });
const filename = resolve('render-check.cjs');
const compiled = new Module(filename);
compiled.filename = filename;
compiled.paths = Module._nodeModulePaths(process.cwd());
compiled.require = createRequire(import.meta.url);
compiled._compile(output.outputFiles[0].text, filename);
const App = compiled.exports.default;
const document = makeDoc('fashion');
document.settings.storeName = 'Database storefront';
document.sections.find(s => s.type === 'navbar').title = 'Database storefront';
document.products[0].name = 'Saved product';
document.products[0].description = 'Database product details';
document.products[0].stock = 3;
const storefront = renderToStaticMarkup(React.createElement(App, { initialDoc: document, storefront: true }));
assert.match(storefront, /Database storefront/);
assert.match(storefront, /Saved product/);
assert.doesNotMatch(storefront, /Database product details/);
assert.match(storefront, /Details/);
assert.match(storefront, /Add Saved product to cart/);
assert.doesNotMatch(storefront, /Order now/);
assert.doesNotMatch(storefront, /Store builder|Save design|Inspector|topbar/);
const editor = renderToStaticMarkup(React.createElement(App, { initialDoc: document, initiallySaved: true }));
assert.match(editor, /Store builder/);
assert.match(editor, /Save design/);
assert.match(editor, /href="\/"/);
console.log('Storefront and admin rendering checks passed.');

// New admin pages must render independently and expose the expected navigation.
for (const [entry, props, checks] of [
  ['src/admin/Products.jsx', {}, [/href="\/admin\/products\/new"/, /Search products/]],
  ['src/admin/ProductForm.jsx', {}, [/Create product/, /Product photography/, /Stock quantity/, /STOREFRONT PREVIEW/]],
  ['src/auth/AuthPage.jsx', { registrationOpen: true, onSignedIn() {} }, [/Good to see you/, /href="\/admin\/register"/, /Show password/]],
]) {
  globalThis.window = { location: { pathname: '/admin/login', search: '' } };
  const result = await build({ entryPoints: [resolve(entry)], bundle: true, write: false, platform: 'node', format: 'cjs', external: ['react'] });
  const page = new Module(filename);
  page.filename = filename; page.paths = compiled.paths; page.require = compiled.require;
  page._compile(result.outputFiles[0].text, filename);
  const html = renderToStaticMarkup(React.createElement(page.exports.default, props));
  for (const check of checks) assert.match(html, check);
  if (entry.includes('AuthPage')) {
    window.location.pathname = '/admin/register';
    const registration = renderToStaticMarkup(React.createElement(page.exports.default, props));
    assert.match(registration, /Confirm password/);
    assert.match(registration, /Phone number/);
    assert.match(registration, /Create your account/);
    const closed = renderToStaticMarkup(React.createElement(page.exports.default, { ...props, registrationOpen: false }));
    assert.doesNotMatch(closed, /Confirm password/);
    assert.match(closed, /already has an owner/);
  }
}
delete globalThis.window;
console.log('Product pages, login, registration and closed-registration rendering checks passed.');

const ordersOutput = await build({ entryPoints: [resolve('src/admin/Orders.jsx')], bundle: true, write: false, platform: 'node', format: 'cjs', external: ['react'] });
const ordersModule = new Module(filename);
ordersModule.filename = filename; ordersModule.paths = compiled.paths; ordersModule.require = compiled.require;
ordersModule._compile(ordersOutput.outputFiles[0].text, filename);
for (const order of [
  { _id: 'legacy-order' },
  { _id: 'current-order', customer: { name: 'Test customer', address: 'Long delivery address' }, items: [{ name: 'Bag', price: 200, quantity: 2 }, { name: 'Shirt', price: 100, quantity: 1 }], total: 500, delivery: 0, payment: 'esewa', status: 'Delivered', createdAt: new Date().toISOString() },
]) {
  const html = renderToStaticMarkup(React.createElement(ordersModule.exports.OrderCard, { order, onUpdate() {} }));
  assert.match(html, /Order status/);
  assert.doesNotMatch(html, /NaN|Invalid Date/);
  if (order.payment) assert.match(html, /esewa/);
}
console.log('Current and incomplete order rendering checks passed.');

const orderOutput = await build({ entryPoints: [resolve('src/ProductOrder.jsx')], bundle: true, write: false, platform: 'node', format: 'cjs', external: ['react'] });
const orderModule = new Module(filename); orderModule.filename = filename; orderModule.paths = compiled.paths; orderModule.require = compiled.require;
orderModule._compile(orderOutput.outputFiles[0].text, filename);
const detail = renderToStaticMarkup(React.createElement(orderModule.exports.default, { product: document.products[0], settings: document.settings, onClose() {} }));
assert.match(detail, /Database product details/); assert.match(detail, /Order now/); assert.doesNotMatch(detail, /Full name/);
const checkout = renderToStaticMarkup(React.createElement(orderModule.exports.default, { cartItems: [{ product: document.products[0], quantity: 1 }], settings: document.settings, onClose() {} }));
assert.match(checkout, /Cash on delivery/); assert.match(checkout, /eSewa/); assert.match(checkout, /Full name/);
console.log('Details, plus button and checkout payment options passed.');

// Saved dimensions must survive both editor and storefront rendering.
const sized = structuredClone(document);
sized.sections = [
  { ...sized.sections.find(s => s.type === 'hero'), width: 72, height: 587 },
  { ...sized.sections.find(s => s.type === 'products'), width: 94, height: 233, photoHeight: 151 },
];
for (const storefront of [false, true]) {
  const html = renderToStaticMarkup(React.createElement(App, { initialDoc: sized, storefront }));
  assert.match(html, /width:72%;height:auto;min-height:587px/);
  assert.match(html, /width:94%;height:auto;min-height:233px/);
  assert.match(html, /--photo-h:151px/);
}
const { readFileSync } = await import('node:fs');
const css = readFileSync(resolve('src/styles.css'), 'utf8');
assert.doesNotMatch(css, /\.block[^{}]*\{[^}]*height:auto!important/);
assert.doesNotMatch(css, /\.public-store \.block\{width:100%!important/);
assert.match(css, /\.public-store \.product-photo\{height:var\(--photo-h\)\}/);
console.log('Saved section widths/heights and product photo dimensions match editor and storefront.');
assert.match(css, /\.public-store \.block-inner\{height:auto;overflow:visible\}/);
assert.doesNotMatch(css, /\.public-store \.block-inner\{[^}]*overflow:auto/);
console.log('Storefront preserves saved minimum heights and expands without internal scrolling.');

assert.match(css, /\.block-inner\{height:auto;width:100%;overflow:visible\}/);
assert.match(css, /\.admin-shell \.layout>\.panel,\.admin-shell \.layout>\.workspace\{overflow:visible;max-height:none;min-width:0\}/);
console.log('Admin panels and canvas use page scrolling; saved minimum dimensions remain intact.');

const adjusted = structuredClone(document);
adjusted.products[0].imageSettings = { fit: 'contain', x: 20, y: 80 };
adjusted.sections.find(s => s.type === 'hero').imageSettings = { fit: 'cover', x: 75, y: 30 };
for (const storefront of [true, false]) {
  const html = renderToStaticMarkup(React.createElement(App, { initialDoc: adjusted, storefront }));
  assert.match(html, /object-fit:contain;object-position:20% 80%/);
  assert.match(html, /object-fit:cover;object-position:75% 30%/);
  if (!storefront) { assert.match(html, /Image adjustment/); assert.match(html, /Horizontal position/); }
}
console.log('Saved image fit and position render in storefront and editor.');

const filteredOrders = [{ _id: '1', payment: 'eSewa', status: 'Pending' }, { _id: '2', payment: 'COD', status: 'Pending' }, { _id: '3', payment: 'eSewa', status: 'Delivered' }];
assert.equal(ordersModule.exports.filterOrders(filteredOrders, 'All', 'eSewa').length, 2);
assert.equal(ordersModule.exports.filterOrders(filteredOrders, 'Pending', 'COD')[0]._id, '2');
assert.equal(ordersModule.exports.filterOrders(filteredOrders, 'Delivered', 'COD').length, 0);
console.log('Payment and fulfillment status filters work together.');
