// Minimal stateless MCP server over Streamable HTTP (JSON responses only).
// Transport-agnostic: `handleMcp(body, deps)` takes a parsed JSON-RPC message
// (or batch) and returns { status, body }. The Appwrite entrypoint is main.js.

export const SERVER_INFO = { name: 'openassets', title: 'OpenAssets', version: '1.0.0' };
const PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26', '2024-11-05'];

export const KINDS = ['icon', 'sticker', 'icon3d', 'card3d', 'banner', 'video', 'scene'];
const KIND_ALIASES = {
  icons: 'icon', stickers: 'sticker', icons3d: 'icon3d', '3d-icon': 'icon3d', cards3d: 'card3d', '3d-card': 'card3d',
  banners: 'banner', videos: 'video', scenes: 'scene',
};
export const normalizeKind = (k) => {
  if (!k) return undefined;
  const v = String(k).toLowerCase().trim();
  return KINDS.includes(v) ? v : KIND_ALIASES[v];
};
export const ASSET_ID_RE = /^\d{4}-\d{2}-\d{2}(?:-\d+)?\/[a-z0-9]+\/[a-z0-9-]+$/;

const INSTRUCTIONS = `OpenAssets is a library of parametric, editable design assets (SVG icons, hand-drawn stickers, 3D icons, 3D project cards, social banners, Remotion video templates, isometric animated scenes), grouped into themed kits.
Use search_assets with a natural-language description of what you need (subject, mood, use case, style); filter by kind when you know it. Each hit includes the editable fields with defaults, variants and an editor URL where a human can customise and download it. Call get_asset for the full React/TSX source of one asset.`;

export const TOOLS = [
  {
    name: 'search_assets',
    title: 'Search assets',
    description:
      `Semantic search over every OpenAssets asset. Returns the best matches ranked by relevance, each with name, kind, description, tags, kit theme and palette, editable fields (with defaults), variant names and an editor URL. Kinds: ${KINDS.join(', ')}.`,
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What you are looking for, e.g. "playful launch banner for a fintech app" or "hand-drawn rain cloud sticker".' },
        kind: { type: 'string', enum: KINDS, description: 'Only return assets of this kind.' },
        since: { type: 'string', description: 'Only assets from kits on/after this date (YYYY-MM-DD).' },
        limit: { type: 'integer', minimum: 1, maximum: 25, default: 8 },
      },
      required: ['query'],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  {
    name: 'get_asset',
    title: 'Get asset',
    description: 'Full details for one asset by id (as returned by search_assets, e.g. "2026-11-22-2/banners/new-world-launch"), including its index.tsx source.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Asset id: <kit-date>/<kind-dir>/<slug>.' } },
      required: ['id'],
    },
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
];

const rpcError = (id, code, message) => ({ jsonrpc: '2.0', id: id ?? null, error: { code, message } });
const ok = (id, result) => ({ jsonrpc: '2.0', id, result });
const toolResult = (data) => ({ content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: data });
const toolError = (message) => ({ content: [{ type: 'text', text: message }], isError: true });

async function callTool(name, args = {}, deps) {
  if (name === 'search_assets') {
    const query = typeof args.query === 'string' ? args.query.trim() : '';
    if (!query) return toolError('`query` is required.');
    if (query.length > 1000) return toolError('`query` is too long (max 1000 chars).');
    let kind;
    if (args.kind) {
      kind = normalizeKind(args.kind);
      if (!kind) return toolError(`Unknown kind "${args.kind}". Use one of: ${KINDS.join(', ')}.`);
    }
    if (args.since && !/^\d{4}-\d{2}-\d{2}$/.test(String(args.since))) return toolError('`since` must be YYYY-MM-DD.');
    const limit = Math.min(25, Math.max(1, Number.parseInt(args.limit ?? 8, 10) || 8));
    const results = await deps.search({ query, kind, since: args.since, limit });
    const weak = results.length > 0 && results.every((r) => r.weak_match);
    return toolResult({
      query,
      count: results.length,
      ...(weak ? { note: 'No strong matches; these are the closest assets but probably not what was asked for.' } : {}),
      results,
    });
  }
  if (name === 'get_asset') {
    const id = typeof args.id === 'string' ? args.id.trim().replace(/^\/+|\/+$/g, '').replace(/\/index\.tsx$/, '') : '';
    if (!ASSET_ID_RE.test(id)) return toolError('`id` must look like "2026-11-22-2/banners/new-world-launch".');
    const asset = await deps.getAsset(id);
    if (!asset) return toolError(`No asset with id "${id}".`);
    return toolResult(asset);
  }
  return null;
}

async function handleOne(msg, deps) {
  if (!msg || typeof msg !== 'object' || msg.jsonrpc !== '2.0' || typeof msg.method !== 'string') {
    return rpcError(msg?.id, -32600, 'Invalid Request');
  }
  const { id, method, params = {} } = msg;
  const isNotification = id === undefined || id === null;
  if (isNotification) return null; // notifications/initialized, notifications/cancelled, …

  switch (method) {
    case 'initialize': {
      const requested = params.protocolVersion;
      return ok(id, {
        protocolVersion: PROTOCOL_VERSIONS.includes(requested) ? requested : PROTOCOL_VERSIONS[0],
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER_INFO,
        instructions: INSTRUCTIONS,
      });
    }
    case 'ping':
      return ok(id, {});
    case 'tools/list':
      return ok(id, { tools: TOOLS });
    case 'tools/call': {
      try {
        const result = await callTool(params.name, params.arguments, deps);
        if (!result) return rpcError(id, -32602, `Unknown tool: ${params.name}`);
        return ok(id, result);
      } catch (e) {
        deps.logError?.(e);
        return ok(id, toolError(`Tool failed: ${e?.message ?? e}`));
      }
    }
    case 'resources/list':
      return ok(id, { resources: [] });
    case 'prompts/list':
      return ok(id, { prompts: [] });
    default:
      return rpcError(id, -32601, `Method not found: ${method}`);
  }
}

/** Returns { status, body } where body is a JSON-RPC response (or batch), or null for 202. */
export async function handleMcp(body, deps) {
  if (Array.isArray(body)) {
    if (body.length === 0) return { status: 400, body: rpcError(null, -32600, 'Empty batch') };
    const out = (await Promise.all(body.map((m) => handleOne(m, deps)))).filter(Boolean);
    return out.length ? { status: 200, body: out } : { status: 202, body: null };
  }
  const res = await handleOne(body, deps);
  return res ? { status: 200, body: res } : { status: 202, body: null };
}
