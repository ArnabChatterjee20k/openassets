// Syncs every asset into the Appwrite VectorsDB collection that powers the MCP
// search function (functions/asset-mcp). Only new or changed assets are
// re-embedded; docs for deleted assets are removed.
//
//   pnpm index              # sync
//   pnpm index --dry-run    # show what would change, write nothing
//
// Env: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY (scopes:
// vectorsdb.documents.read/write, embeddings.write), APPWRITE_VECTORS_DB_ID,
// APPWRITE_VECTORS_COLLECTION_ID (default "assets"). Without a key it warns
// and exits 0 so forks and local runs don't fail.
import { createHash } from 'node:crypto';
import { Client, Embeddings, EmbeddingModel, Query, VectorsDB } from 'node-appwrite';
import { describeFields } from '../src/lib/params';
import { variantNames, type DropInfo } from '../src/lib/types';
import { hasFlag, loadAssets, log, readDrop, type LoadedAsset } from './lib/common';

const env = (k: string, d?: string) => process.env[k] || d;
const ENDPOINT = env('APPWRITE_ENDPOINT', 'https://sgp.cloud.appwrite.io/v1')!;
const PROJECT = env('APPWRITE_PROJECT_ID', '6b091697003884aa1d06')!;
const KEY = env('APPWRITE_API_KEY');
const DB = env('APPWRITE_VECTORS_DB_ID', '6b0916d1002167a51011')!;
const COL = env('APPWRITE_VECTORS_COLLECTION_ID', 'assets')!;
const DRY = hasFlag('dry-run');
const EMBED_BATCH = 16;
const WRITE_BATCH = 25;

if (!KEY) {
  log('⚠ APPWRITE_API_KEY is not set; skipping the search index sync.');
  process.exit(0);
}

const client = new Client().setEndpoint(ENDPOINT).setProject(PROJECT).setKey(KEY);
const vdb = new VectorsDB(client);
const embeddings = new Embeddings(client);

/** Appwrite IDs: ≤36 chars of [a-zA-Z0-9._-], so hash the asset path. */
const docId = (assetId: string) => createHash('sha1').update(assetId).digest('hex').slice(0, 32);
const clip = (v: unknown, n = 80) => (typeof v === 'string' && v.length > n ? `${v.slice(0, n)}…` : v);

interface Indexed {
  $id: string;
  text: string;
  metadata: Record<string, unknown>;
}

function build(a: LoadedAsset, drop: DropInfo): Indexed {
  const { meta } = a.mod;
  const fields = describeFields(a.mod.schema).map((f) => ({
    key: f.key,
    ui: f.ui,
    label: f.label,
    default: clip(f.defaultValue),
    ...(f.options && f.ui === 'select' ? { options: f.options } : {}),
    ...(f.ui === 'number' ? { min: f.min, max: f.max } : {}),
  }));
  const tags = meta.tags ?? [];
  // nomic-embed-text expects task prefixes: "search_document:" here, "search_query:" at query time.
  const text = [
    `search_document: ${meta.name}. A ${meta.category ? `${meta.category} ` : ''}${a.kind} asset.`,
    meta.description ?? '',
    tags.length ? `Tags: ${tags.join(', ')}.` : '',
    `Editable: ${fields.filter((f) => f.ui !== 'color' && f.ui !== 'font').map((f) => f.label).join(', ')}.`,
    `From the kit "${drop.theme}": ${drop.description}`,
    drop.idea ? `Idea: ${drop.idea}.` : '',
  ]
    .filter(Boolean)
    .join('\n');
  const metadata: Record<string, unknown> = {
    id: a.id,
    kind: a.kind,
    date: a.date,
    slug: a.slug,
    category: meta.category ?? '',
    name: meta.name,
    description: meta.description ?? '',
    tags,
    theme: drop.theme,
    palette: drop.palette,
    fields,
    variants: variantNames(a.mod),
    ...(a.mod.video ? { video: a.mod.video } : {}),
    ...(a.mod.scene ? { scene: a.mod.scene } : {}),
  };
  metadata.hash = createHash('sha256').update(text).update(JSON.stringify(metadata)).digest('hex').slice(0, 16);
  return { $id: docId(a.id), text, metadata };
}

async function existingHashes(): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  let cursor: string | undefined;
  for (;;) {
    const page = await vdb.listDocuments({
      databaseId: DB,
      collectionId: COL,
      queries: [Query.select(['$id', 'metadata']), Query.limit(100), ...(cursor ? [Query.cursorAfter(cursor)] : [])],
      total: false,
    });
    for (const d of page.documents) out.set(d.$id, String((d as any).metadata?.hash ?? ''));
    if (page.documents.length < 100) return out;
    cursor = page.documents.at(-1)!.$id;
  }
}

async function embed(texts: string[]): Promise<number[][]> {
  const res = await embeddings.createTextEmbeddings({ texts, model: EmbeddingModel.Nomicembedtext });
  return res.embeddings.map((e, i) => {
    if (e.error) throw new Error(`embedding failed for item ${i}: ${e.error}`);
    return e.embedding;
  });
}

const chunks = <T>(xs: T[], n: number) => Array.from({ length: Math.ceil(xs.length / n) }, (_, i) => xs.slice(i * n, i * n + n));

const assets = await loadAssets();
const drops = new Map<string, DropInfo>();
const docs = assets.map((a) => {
  if (!drops.has(a.date)) drops.set(a.date, readDrop(a.date));
  return build(a, drops.get(a.date)!);
});

const remote = await existingHashes();
const changed = docs.filter((d) => remote.get(d.$id) !== d.metadata.hash);
const live = new Set(docs.map((d) => d.$id));
const orphans = [...remote.keys()].filter((id) => !live.has(id));
log(`→ ${docs.length} assets, ${remote.size} indexed: ${changed.length} to embed, ${orphans.length} to delete`);

if (DRY) {
  for (const d of changed) log(`  + ${d.metadata.id}`);
  for (const id of orphans) log(`  - ${id}`);
  process.exit(0);
}

let done = 0;
for (const batch of chunks(changed, EMBED_BATCH)) {
  const vectors = await embed(batch.map((d) => d.text));
  const payload = batch.map((d, i) => ({ $id: d.$id, embeddings: vectors[i], metadata: d.metadata }));
  for (const w of chunks(payload, WRITE_BATCH)) await vdb.upsertDocuments({ databaseId: DB, collectionId: COL, documents: w });
  done += batch.length;
  log(`  embedded ${done}/${changed.length}`);
}

for (const ids of chunks(orphans, 100)) {
  await vdb.deleteDocuments({ databaseId: DB, collectionId: COL, queries: [Query.equal('$id', ids)] });
}
log('✓ search index in sync');
