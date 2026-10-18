import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(new URL('../backend/package.json', import.meta.url));
const { parse } = require('dotenv');
let env = {};
try { env = parse(readFileSync(resolve(root, 'backend/.env'))); } catch {}
const port = Number(process.env.PORT || env.PORT) || 4000;
const children = [];
let stopping = false;

async function probe(url, validate) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(2000) });
    return response.ok && await validate(response);
  } catch { return false; }
}

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill('SIGTERM');
  process.exitCode = code;
}

function start(label, args, cwd) {
  console.log(`Starting ${label}…`);
  const child = spawn(process.execPath, args, { cwd, stdio: 'inherit', windowsHide: true });
  children.push(child);
  child.on('error', error => { console.error(`${label}: ${error.message}`); stop(1); });
  child.on('exit', code => { if (!stopping) { console.error(`${label} stopped.`); stop(code || 0); } });
}

if (await probe(`http://127.0.0.1:${port}/api/health`, async r => typeof (await r.json()).database === 'boolean')) {
  console.log(`Using the running API on port ${port}.`);
} else {
  start('API', ['index.js'], resolve(root, 'backend'));
}
if (await probe('http://127.0.0.1:5173/', async r => (await r.text()).includes('/src/main.jsx'))) {
  console.log('Using the running frontend on port 5173.');
} else {
  start('frontend', ['node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--port', '5173', '--strictPort'], resolve(root, 'frontend'));
}
console.log('\nStore: http://localhost:5173/\nAdmin: http://localhost:5173/admin\n');
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
