import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { createServer } from 'node:http';

const root = resolve(process.argv[2] ?? 'www');
const port = Number(process.argv[3] ?? 8100);
const host = process.argv[4] ?? '127.0.0.1';

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

function resolveAssetPath(urlPath) {
  const decodedPath = decodeURIComponent(urlPath.split('?')[0] || '/');
  const normalizedPath = normalize(decodedPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const assetPath = resolve(join(root, normalizedPath));

  if (!assetPath.startsWith(root + sep) && assetPath !== root) {
    return join(root, 'index.html');
  }

  if (existsSync(assetPath) && statSync(assetPath).isFile()) {
    return assetPath;
  }

  return join(root, 'index.html');
}

const server = createServer((req, res) => {
  const assetPath = resolveAssetPath(req.url ?? '/');
  const ext = extname(assetPath);

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Content-Type', mimeTypes.get(ext) ?? 'application/octet-stream');

  createReadStream(assetPath)
    .on('error', () => {
      res.statusCode = 404;
      res.end('Not found');
    })
    .pipe(res);
});

server.listen(port, host, () => {
  console.log(`Serving ${root} at http://${host}:${port}`);
});

