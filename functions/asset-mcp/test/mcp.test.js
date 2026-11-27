import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handleMcp, TOOLS } from '../src/mcp.js';

const calls = [];
const deps = {
  search: async (a) => (calls.push(a), [{ id: '2026-11-22-2/banners/new-world-launch', score: 0.8 }]),
  getAsset: async (id) => (id.endsWith('missing') ? null : { id, source: 'x' }),
};
const rpc = (method, params, id = 1) => handleMcp({ jsonrpc: '2.0', id, method, params }, deps);

test('initialize negotiates protocol version', async () => {
  const r = await rpc('initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } });
  assert.equal(r.status, 200);
  assert.equal(r.body.result.protocolVersion, '2025-06-18');
  assert.ok(r.body.result.capabilities.tools);
  const r2 = await rpc('initialize', { protocolVersion: '1999-01-01' });
  assert.equal(r2.body.result.protocolVersion, '2025-11-25');
});

test('notifications get 202', async () => {
  const r = await handleMcp({ jsonrpc: '2.0', method: 'notifications/initialized' }, deps);
  assert.equal(r.status, 202);
});

test('tools/list', async () => {
  const r = await rpc('tools/list');
  assert.deepEqual(r.body.result.tools.map((t) => t.name), TOOLS.map((t) => t.name));
});

test('search_assets validates and normalises', async () => {
  const r = await rpc('tools/call', { name: 'search_assets', arguments: { query: ' romance banner ', kind: 'banners', limit: 99 } });
  assert.equal(r.body.result.isError, undefined);
  assert.deepEqual(calls.at(-1), { query: 'romance banner', kind: 'banner', since: undefined, limit: 25 });
  assert.equal(r.body.result.structuredContent.count, 1);
  assert.equal(JSON.parse(r.body.result.content[0].text).results[0].score, 0.8);
  const bad = await rpc('tools/call', { name: 'search_assets', arguments: { query: 'x', kind: 'gif' } });
  assert.equal(bad.body.result.isError, true);
  const empty = await rpc('tools/call', { name: 'search_assets', arguments: {} });
  assert.equal(empty.body.result.isError, true);
});

test('get_asset rejects path tricks', async () => {
  for (const id of ['../etc/passwd', '2026-11-22/banners/../../x', 'https://evil/x', '2026-11-22/banners/a b']) {
    const r = await rpc('tools/call', { name: 'get_asset', arguments: { id } });
    assert.equal(r.body.result.isError, true, id);
  }
  const ok = await rpc('tools/call', { name: 'get_asset', arguments: { id: '/2026-11-22-2/banners/new-world-launch/' } });
  assert.equal(ok.body.result.structuredContent.id, '2026-11-22-2/banners/new-world-launch');
  const miss = await rpc('tools/call', { name: 'get_asset', arguments: { id: '2026-11-22/banners/missing' } });
  assert.equal(miss.body.result.isError, true);
});

test('unknown method / tool / bad request', async () => {
  assert.equal((await rpc('nope')).body.error.code, -32601);
  assert.equal((await rpc('tools/call', { name: 'nope' })).body.error.code, -32602);
  assert.equal((await handleMcp({ foo: 1 }, deps)).body.error.code, -32600);
});

test('batch', async () => {
  const r = await handleMcp([{ jsonrpc: '2.0', id: 1, method: 'ping' }, { jsonrpc: '2.0', method: 'notifications/initialized' }], deps);
  assert.equal(r.body.length, 1);
});
