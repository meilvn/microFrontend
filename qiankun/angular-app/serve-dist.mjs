// 轻量静态服务器：托管 dist/angular-app/browser，并对非文件路由做 SPA 回退
// （Angular history 路由需要回退到 index.html，python http.server 做不到）。
// 用法：node serve-dist.mjs [端口，默认 8003]
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./dist/angular-app/browser/', import.meta.url));
const port = Number(process.argv[2] ?? 8003);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let pathname = decodeURIComponent(url.pathname);

  // 目录请求回退到 index.html；不存在文件的 SPA 路由也回退到 index.html
  let filePath = normalize(join(root, pathname));
  let body;
  try {
    body = await readFile(filePath);
  } catch {
    filePath = join(root, 'index.html');
    try {
      body = await readFile(filePath);
    } catch {
      res.writeHead(500);
      res.end('index.html not found');
      return;
    }
  }

  const ext = extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] ?? 'application/octet-stream' });
  res.end(body);
}).listen(port, '0.0.0.0', () => {
  console.log(`[serve-dist] http://127.0.0.1:${port}/ (SPA fallback enabled)`);
});
