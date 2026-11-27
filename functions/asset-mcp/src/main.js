// Appwrite Function entrypoint: OpenAssets MCP server (Streamable HTTP, stateless).
// Connect with: claude mcp add --transport http openassets https://<function-domain>/
import { timingSafeEqual } from 'node:crypto';
import { handleMcp, SERVER_INFO } from './mcp.js';
import { createBackend } from './search.js';

const env = (k, d) => process.env[k] || d;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, Mcp-Session-Id, Mcp-Protocol-Version, Last-Event-ID',
};

const tokenOk = (header, token) => {
  const got = Buffer.from(String(header ?? '').replace(/^Bearer\s+/i, ''));
  const want = Buffer.from(token);
  return got.length === want.length && timingSafeEqual(got, want);
};

export default async ({ req, res, log, error }) => {
  if (req.method === 'OPTIONS') return res.text('', 204, CORS);

  const token = env('MCP_TOKEN');
  if (token && !tokenOk(req.headers['authorization'], token)) {
    return res.json({ jsonrpc: '2.0', id: null, error: { code: -32001, message: 'Unauthorized' } }, 401, CORS);
  }

  // Stateless server: no SSE stream to resume and no session to delete.
  if (req.method === 'GET') {
    if (String(req.headers['accept'] ?? '').includes('text/event-stream')) return res.text('', 405, { ...CORS, Allow: 'POST' });
    return res.json({ ...SERVER_INFO, transport: 'streamable-http', endpoint: 'POST /' }, 200, CORS);
  }
  if (req.method === 'DELETE') return res.text('', 405, { ...CORS, Allow: 'POST' });
  if (req.method !== 'POST') return res.text('', 405, { ...CORS, Allow: 'POST' });

  let body;
  try {
    body = req.bodyJson ?? JSON.parse(req.bodyText || req.body || '');
  } catch {
    return res.json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }, 400, CORS);
  }

  const backend = createBackend({
    endpoint: env('APPWRITE_FUNCTION_API_ENDPOINT', 'https://sgp.cloud.appwrite.io/v1'),
    projectId: env('APPWRITE_FUNCTION_PROJECT_ID'),
    apiKey: req.headers['x-appwrite-key'] || env('APPWRITE_API_KEY'),
    databaseId: env('APPWRITE_VECTORS_DB_ID', '6b0916d1002167a51011'),
    collectionId: env('APPWRITE_VECTORS_COLLECTION_ID', 'assets'),
    siteUrl: env('SITE_URL', 'https://arnabchatterjee20k.github.io/openassets/'),
    sourceBase: env('SOURCE_BASE_URL', 'https://raw.githubusercontent.com/ArnabChatterjee20k/openassets/main/'),
  });

  const out = await handleMcp(body, { ...backend, logError: (e) => error(String(e?.stack ?? e)) });
  if (out.status === 202) return res.text('', 202, CORS);
  return res.json(out.body, out.status, CORS);
};
