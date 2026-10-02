const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');

const password = 'family-test-passphrase-2026';
let tempDir, child, base, cookie;

async function freePort() {
  const server = net.createServer();
  await new Promise((resolve, reject) => server.listen(0, '127.0.0.1', err => err ? reject(err) : resolve()));
  const { port } = server.address();
  await new Promise(resolve => server.close(resolve));
  return port;
}
async function waitReady() {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('Server exited before becoming ready.');
    try {
      const response = await fetch(base + '/health');
      if (response.ok) return;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('Server did not become ready.');
}
const authFetch = (url, options = {}) => fetch(base + url, { ...options, headers: { ...(options.headers || {}), Cookie: cookie } });
after(async () => {
  if (child && child.exitCode === null) child.kill();
  if (tempDir) await fs.rm(tempDir, { recursive: true, force: true });
});

test('family app server supports the launch-critical flows', async () => {
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'sunday-table-test-'));
  const port = await freePort();
  base = 'http://127.0.0.1:' + port;
  child = spawn(process.execPath, [path.resolve(__dirname, '../server.js')], {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, PORT: String(port), DATA_DIR: tempDir, FAMILY_PASSWORD: password, NODE_ENV: 'test' },
    stdio: 'ignore'
  });
  await waitReady();

  const home = await fetch(base + '/');
  assert.equal(home.status, 200);
  assert.match(home.headers.get('content-type'), /text\/html/);
  assert.match(await home.text(), /Family contributions/);
  assert.deepEqual(await (await fetch(base + '/health')).json(), { ok: true });
  assert.deepEqual(await (await fetch(base + '/api/status')).json(), { enabled: true, authenticated: false });
  assert.equal((await fetch(base + '/api/state')).status, 401);

  const badLogin = await fetch(base + '/api/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: 'wrong password' })
  });
  assert.equal(badLogin.status, 401);
  const login = await fetch(base + '/api/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password })
  });
  assert.equal(login.status, 200);
  cookie = login.headers.get('set-cookie').split(';')[0];
  assert.equal((await authFetch('/api/status')).status, 200);
  assert.deepEqual(await (await authFetch('/api/status')).json(), { enabled: true, authenticated: true });

  const empty = await (await authFetch('/api/state')).json();
  assert.deepEqual(empty, { revision: 0, state: null });
  const state = { memos: [{ id: 'memo-1' }], recipes: [{ id: 'recipe-1' }], contributions: [{ id: 'story-1' }], settings: { showSamples: false } };
  const first = await authFetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expectedRevision: 0, state }) });
  assert.equal(first.status, 200);
  assert.equal((await first.json()).revision, 1);
  const stale = await authFetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expectedRevision: 0, state }) });
  assert.equal(stale.status, 409);
  assert.equal((await stale.json()).revision, 1);
  assert.deepEqual((await (await authFetch('/api/state')).json()).state, state);
  const updatedState = { ...state, settings: { showSamples: true } };
  const second = await authFetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expectedRevision: 1, state: updatedState }) });
  assert.equal(second.status, 200);
  assert.equal((await second.json()).revision, 2);
  assert.equal((await fs.readdir(path.join(tempDir, 'backups'))).length, 1);

  const media = Buffer.from('fake-audio-bytes');
  const upload = await authFetch('/api/media/audio-test-1', { method: 'PUT', headers: { 'Content-Type': 'audio/webm' }, body: media });
  assert.equal(upload.status, 200);
  const download = await authFetch('/api/media/audio-test-1');
  assert.equal(download.status, 200);
  assert.equal(download.headers.get('content-type'), 'audio/webm');
  assert.deepEqual(Buffer.from(await download.arrayBuffer()), media);
  assert.equal((await authFetch('/api/media/unknown-media')).status, 404);
  assert.equal((await authFetch('/api/media/bad-type', { method: 'PUT', headers: { 'Content-Type': 'text/plain' }, body: 'x' })).status, 415);

  const invalid = await authFetch('/api/state', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ expectedRevision: 1, state: {} }) });
  assert.equal(invalid.status, 400);
  const logout = await authFetch('/api/logout', { method: 'POST', body: '{}' });
  assert.equal(logout.status, 200);
  assert.equal((await authFetch('/api/state')).status, 401);
});
