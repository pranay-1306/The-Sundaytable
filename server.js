const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = __dirname;
const webRoot = path.join(root, 'outputs');
const dataRoot = path.resolve(process.env.DATA_DIR || path.join(root, 'data'));
const mediaRoot = path.join(dataRoot, 'media');
const stateFile = path.join(dataRoot, 'family.json');
const password = process.env.FAMILY_PASSWORD || '';
const port = Number(process.env.PORT || 8787);
const sessions = new Map();
const loginAttempts = new Map();
let writes = Promise.resolve();
fs.mkdirSync(mediaRoot, { recursive: true });

function cookieValue(req, name) {
  const row = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(name + '='));
  return row ? decodeURIComponent(row.slice(name.length + 1)) : '';
}
function authenticated(req) { const token = cookieValue(req, 'sunday_session'); if (!token) return false; const expires = sessions.get(token); if (!expires || expires < Date.now()) { sessions.delete(token); return false; } return true; }
function send(res, status, body, type = 'application/json; charset=utf-8', headers = {}) {
  res.writeHead(status, { 'Content-Type': type, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Cache-Control': 'no-store', ...headers });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
}
function fail(res, status, error) { send(res, status, { error }); }
function safeOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}
function requireAuth(req, res) {
  if (!password) { fail(res, 503, 'Family sync is not configured on this server.'); return false; }
  if (!authenticated(req)) { fail(res, 401, 'Please sign in to the family collection.'); return false; }
  return true;
}
function body(req, limit = 6 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = []; let size = 0;
    req.on('data', chunk => { size += chunk.length; if (size > limit) { reject(Object.assign(new Error('Request is too large.'), { status: 413 })); req.destroy(); } else chunks.push(chunk); });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}
async function readState() {
  try { return JSON.parse(await fs.promises.readFile(stateFile, 'utf8')); }
  catch (err) { if (err.code === 'ENOENT') return { revision: 0, state: null }; throw err; }
}
async function writeState(next) {
  const prior = await readState();
  if (prior.state) {
    const backups = path.join(dataRoot, 'backups'); fs.mkdirSync(backups, { recursive: true });
    const name = `family-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    await fs.promises.copyFile(stateFile, path.join(backups, name));
    const old = (await fs.promises.readdir(backups)).sort().reverse();
    await Promise.all(old.slice(12).map(f => fs.promises.rm(path.join(backups, f), { force: true })));
  }
  const temp = stateFile + '.tmp';
  await fs.promises.writeFile(temp, JSON.stringify(next), { mode: 0o600 });
  await fs.promises.rename(temp, stateFile);
}
const mimeExt = new Map([
  ['image/jpeg', 'jpg'], ['image/png', 'png'], ['image/webp', 'webp'], ['image/gif', 'gif'], ['image/avif', 'avif'],
  ['audio/mpeg', 'mp3'], ['audio/x-mpeg', 'mp3'], ['audio/mp4', 'm4a'], ['audio/x-m4a', 'm4a'], ['audio/wav', 'wav'], ['audio/x-wav', 'wav'],
  ['audio/webm', 'webm'], ['audio/ogg', 'ogg'], ['audio/aac', 'aac'], ['audio/3gpp', '3gp']
]);
function mediaId(value) { return /^[a-zA-Z0-9-]{1,100}$/.test(value || ''); }
function mediaFile(id, ext) { return path.join(mediaRoot, `${id}.${ext}`); }

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, { ok: true });
    if (url.pathname.startsWith('/api/')) {
      if (!safeOrigin(req)) return fail(res, 403, 'This request origin is not allowed.');
      if (req.method === 'GET' && url.pathname === '/api/status') return send(res, 200, { enabled: !!password, authenticated: authenticated(req) });
      if (req.method === 'POST' && url.pathname === '/api/login') {
        if (!password) return fail(res, 503, 'Family sync is not configured on this server.');
        if (password.length < 16) return fail(res, 503, 'Set a family passphrase of at least 16 characters in the server settings.');
        const now = Date.now(), key = req.socket.remoteAddress || 'unknown';
        const recent = (loginAttempts.get(key) || []).filter(t => now - t < 15 * 60 * 1000);
        if (recent.length >= 12) return fail(res, 429, 'Too many sign-in attempts. Try again in 15 minutes.');
        let input; try { input = JSON.parse((await body(req, 4096)).toString('utf8')); } catch { return fail(res, 400, 'Invalid sign-in request.'); }
        const supplied = Buffer.from(String(input.password || ''));
        const expected = Buffer.from(password);
        if (supplied.length !== expected.length || !crypto.timingSafeEqual(supplied, expected)) {
          recent.push(now); loginAttempts.set(key, recent); return fail(res, 401, 'That family passphrase did not match.');
        }
        loginAttempts.delete(key);
        const token = crypto.randomBytes(32).toString('base64url'); sessions.set(token, now + 12 * 60 * 60 * 1000);
        const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
        return send(res, 200, { ok: true }, 'application/json; charset=utf-8', { 'Set-Cookie': `sunday_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${secure}` });
      }
      if (req.method === 'POST' && url.pathname === '/api/logout') {
        const token = cookieValue(req, 'sunday_session'); sessions.delete(token);
        return send(res, 200, { ok: true }, 'application/json; charset=utf-8', { 'Set-Cookie': 'sunday_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
      }
      if (req.method === 'GET' && url.pathname === '/api/state') {
        if (!requireAuth(req, res)) return;
        return send(res, 200, await readState());
      }
      if (req.method === 'PUT' && url.pathname === '/api/state') {
        if (!requireAuth(req, res)) return;
        let payload; try { payload = JSON.parse((await body(req)).toString('utf8')); } catch (err) { return fail(res, err.status || 400, err.status ? err.message : 'Invalid collection data.'); }
        if (!payload || !Number.isInteger(payload.expectedRevision) || !payload.state || !Array.isArray(payload.state.recipes) || !Array.isArray(payload.state.memos) || !Array.isArray(payload.state.contributions)) return fail(res, 400, 'Collection data is incomplete.');
        let result;
        const operation = writes.then(async () => {
          const current = await readState();
          if (payload.expectedRevision !== current.revision) { result = { conflict: current }; return; }
          const next = { revision: current.revision + 1, updatedAt: new Date().toISOString(), state: payload.state };
          await writeState(next); result = { saved: next };
        });
        writes = operation.catch(() => {}); await operation;
        if (result.conflict) return send(res, 409, result.conflict);
        return send(res, 200, result.saved);
      }      const uploadMatch = url.pathname.match(/^\/api\/media\/([a-zA-Z0-9-]{1,100})$/);
      if (uploadMatch && req.method === 'PUT') {
        if (!requireAuth(req, res)) return;
        const id = uploadMatch[1], type = String(req.headers['content-type'] || '').split(';')[0].toLowerCase(), ext = mimeExt.get(type);
        if (!mediaId(id) || !ext || (!type.startsWith('image/') && !type.startsWith('audio/'))) return fail(res, 415, 'Use a supported image or audio file.');
        const data = await body(req, 32 * 1024 * 1024);
        await fs.promises.writeFile(mediaFile(id, ext), data, { mode: 0o600 });
        const info = { id, type, ext, bytes: data.length };
        await fs.promises.writeFile(path.join(mediaRoot, `${id}.json`), JSON.stringify(info), { mode: 0o600 });
        return send(res, 200, info);
      }
      const mediaMatch = url.pathname.match(/^\/api\/media\/([a-zA-Z0-9-]{1,100})$/);
      if (mediaMatch && req.method === 'GET') {
        if (!requireAuth(req, res)) return;
        const infoPath = path.join(mediaRoot, `${mediaMatch[1]}.json`);
        let info; try { info = JSON.parse(await fs.promises.readFile(infoPath, 'utf8')); } catch { return fail(res, 404, 'Media not found.'); }
        const data = await fs.promises.readFile(mediaFile(info.id, info.ext));
        return send(res, 200, data, info.type, { 'Content-Length': data.length });
      }
      return fail(res, 404, 'API route not found.');
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') return fail(res, 405, 'Method not allowed.');
    const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const file = path.resolve(webRoot, `.${pathname}`);
    if (!file.startsWith(webRoot + path.sep)) return fail(res, 403, 'Forbidden.');
    let stat; try { stat = await fs.promises.stat(file); } catch { return fail(res, 404, 'File not found.'); }
    if (!stat.isFile()) return fail(res, 404, 'File not found.');
    const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  } catch (err) {
    if (!res.headersSent) fail(res, err.status || 500, err.status ? err.message : 'The server could not complete that request.');
    else res.destroy();
  }
});
server.listen(port, '0.0.0.0', () => console.log(`Sunday Table listening on port ${port}; persistent data: ${dataRoot}`));
