import { build } from 'esbuild';
import { createRequire } from 'node:module';
import Module from 'node:module';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import React from 'react';

// Exercise upload handlers with a delayed API response and lightweight hook state.
const output = await build({ entryPoints: [resolve('src/Media.jsx')], bundle: true, write: false, platform: 'node', format: 'cjs', external: ['react'] });
const compiled = new Module(resolve('media-check.cjs'));
const require = createRequire(import.meta.url);
compiled.require = name => name === 'react' ? {
  ...React, useRef: value => ({ current: value }), useState: value => [value, () => {}]
} : require(name);
compiled._compile(output.outputFiles[0].text, compiled.id);
const { ImageUpload } = compiled.exports;
const children = tree => React.Children.toArray(tree.props.children);
const file = new File(['image'], 'photo.png', { type: 'image/png' });
let finish, requests = 0;
const original = globalThis.fetch;
globalThis.fetch = async () => { requests++; return await new Promise(resolve => { finish = resolve; }); };
try {
  const changes = [], busy = [];
  const tree = ImageUpload({ value: 'https://example.com/old.png', onChange: url => changes.push(url), onBusyChange: value => busy.push(value) });
  const input = children(tree).find(child => child.type === 'input');
  const remove = children(tree).find(child => child.type === 'button' && child.props.children === 'Remove image');
  assert.equal(remove.props.type, 'button', 'removing an image must not submit the product form');
  const upload = input.props.onChange({ target: { files: [file] } });
  assert.deepEqual(busy, [true]);
  await input.props.onChange({ target: { files: [file] } });
  assert.equal(requests, 1, 'concurrent upload attempts are ignored');
  assert.deepEqual(changes, []);
  finish(Response.json({ url: 'https://example.com/new.png' }));
  await upload;
  assert.deepEqual(changes, ['https://example.com/new.png']);
  assert.deepEqual(busy, [true, false]);
  const disabled = ImageUpload({ disabled: true, onChange: () => assert.fail('disabled upload') });
  await children(disabled).find(child => child.type === 'input').props.onChange({ target: { files: [file] } });
  assert.equal(requests, 1);
  const failed = input.props.onChange({ target: { files: [file] } });
  finish(Response.json({ error: 'Upload failed' }, { status: 502 }));
  await failed;
  assert.deepEqual(busy, [true, false, true, false], 'failed uploads release the save lock');
  assert.equal(changes.length, 1);
  console.log('Image removal, delayed upload, duplicate upload, disabled state and failure checks passed.');
} finally { globalThis.fetch = original; }
