import { byteRange } from './_range.js';
import { readFile } from './_files.js';
import { json } from './_auth.js';
import { storageError } from './_firebase.js';
export default async function handler(req, res) {
  if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('Allow', 'GET, HEAD'); return json(res, 405, { error: 'method_not_allowed' }); }
  const id = new URL(req.url, 'http://localhost').searchParams.get('id');
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id || '')) return json(res, 400, { error: 'invalid_id' });
  try {
    const file = await readFile(id);
    if (!file) return json(res, 404, { error: 'not_found' });
    const range = req.method === 'GET' ? byteRange(req.headers?.range, file.buffer.length) : null;
    res.setHeader('Accept-Ranges', 'bytes');
    if (range?.invalid) {
      res.setHeader('Content-Range', 'bytes */' + file.buffer.length);
      return json(res, 416, { error: 'range_not_satisfiable' });
    }
    const bytes = range ? file.buffer.subarray(range.start, range.end + 1) : file.buffer;
    res.statusCode = range ? 206 : 200;
    if (range) res.setHeader('Content-Range', `bytes ${range.start}-${range.end}/${file.buffer.length}`);
    res.setHeader('Content-Type', file.contentType);
    res.setHeader('Content-Length', String(bytes.length));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Uploaded SVG/other files must never execute scripts under the site's origin.
    res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'; style-src 'unsafe-inline'");
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Vercel-CDN-Cache-Control', range ? 'no-store' : 'public, max-age=31536000');
    return res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch (error) { return storageError(res, error); }
}
