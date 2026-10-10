// Minimal static file server for local preview of the Second Opinion site.
// Run: node server.js   ->   http://localhost:5173
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 5173;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.woff2': 'font/woff2',
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  let urlPath = decodeURIComponent(url.pathname);
  if (urlPath === '/') urlPath = '/index.html';
  else if (!path.extname(urlPath)) urlPath += '.html'; // clean URLs, as on Vercel
  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(filePath, (err, data) => {
    if (err) { return fs.readFile(path.join(ROOT, '404.html'), (e2, page) => { res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }); res.end(e2 ? '404 Not Found' : page); }); }
    const type = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}).listen(PORT, () => console.log('Second Opinion site running at http://localhost:' + PORT));
