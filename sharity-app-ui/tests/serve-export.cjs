// Serves the real Expo production export, including /app history fallback.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../dist-e2e');
if (!fs.existsSync(path.join(root, 'index.html'))) throw new Error('Run npm run build:e2e before Playwright.');
const types = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff2': 'font/woff2', '.json': 'application/json' };
http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const relative = pathname.replace(/^\/app\/?/, '').replace(/^\/+/, '');
  const candidate = path.resolve(root, relative);
  if (!candidate.startsWith(root + path.sep) && candidate !== root) { res.writeHead(403).end(); return; }
  const file = fs.existsSync(candidate) && fs.statSync(candidate).isFile() ? candidate : path.join(root, 'index.html');
  const type = types[path.extname(file)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': /text\/|javascript|json/.test(type) ? `${type}; charset=utf-8` : type, 'Cache-Control': 'no-store' });
  const stream = fs.createReadStream(file);
  stream.on('error', () => { if (!res.headersSent) res.writeHead(503); res.end('Export is unavailable. Finish the build before running tests.'); });
  stream.pipe(res);
}).listen(8097, '127.0.0.1');
