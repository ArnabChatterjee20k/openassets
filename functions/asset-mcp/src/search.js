// Appwrite-backed search + lookup used by the MCP tools.
import { Client, Embeddings, EmbeddingModel, Query, VectorsDB } from 'node-appwrite';
import { createHash } from 'node:crypto';

/** Cosine distance above which a hit is considered unrelated and dropped. */
// Measured on the live index: on-topic hits sit at ≤0.36, unrelated queries at ≥0.42.
const MAX_DISTANCE = Number(process.env.MAX_DISTANCE ?? 0.4);
/** Small boost per query word that exactly matches a tag or the kind. */
const TAG_BONUS = 0.02;

export const docId = (assetId) => createHash('sha1').update(assetId).digest('hex').slice(0, 32);

export function createBackend({ endpoint, projectId, apiKey, databaseId, collectionId, siteUrl, sourceBase }) {
  const client = new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey);
  const vdb = new VectorsDB(client);
  const embeddings = new Embeddings(client);
  const site = siteUrl.replace(/\/?$/, '/');
  const editorUrl = (id) => `${site}#/asset/${id}`;

  const shape = (m) => ({
    id: m.id,
    name: m.name,
    kind: m.kind,
    ...(m.category ? { category: m.category } : {}),
    description: m.description,
    tags: m.tags,
    kit: { date: m.date, theme: m.theme, palette: m.palette },
    fields: m.fields,
    variants: m.variants,
    ...(m.video ? { video: m.video } : {}),
    ...(m.scene ? { scene: m.scene } : {}),
    editor_url: editorUrl(m.id),
  });

  async function search({ query, kind, since, limit }) {
    const emb = await embeddings.createTextEmbeddings({
      texts: [`search_query: ${query}`],
      model: EmbeddingModel.Nomicembedtext,
    });
    const e = emb.embeddings[0];
    if (e.error) throw new Error(`embedding failed: ${e.error}`);
    const queries = [Query.vectorCosine('embeddings', e.embedding), Query.select(['$id', 'metadata']), Query.limit(limit * 2)];
    if (kind) queries.push(Query.equal('metadata.kind', kind));
    if (since) queries.push(Query.greaterThanEqual('metadata.date', since));
    const res = await vdb.createQuery({ databaseId, collectionId, queries, total: false });

    const words = new Set(query.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2));
    const ranked = res.documents
      .map((d) => {
        const m = d.metadata ?? {};
        const distance = Number(d.$distance ?? 1);
        const hits = [...(m.tags ?? []), m.kind].filter((t) => words.has(String(t).toLowerCase())).length;
        return { m, distance, rank: distance - Math.min(3, hits) * TAG_BONUS };
      })
      .sort((a, b) => a.rank - b.rank);
    const out = (rs, weak) =>
      rs.map((r) => ({ score: Math.round((1 - r.distance) * 1000) / 1000, ...(weak ? { weak_match: true } : {}), ...shape(r.m) }));
    const strong = ranked.filter((r) => r.distance <= MAX_DISTANCE).slice(0, limit);
    // Nothing relevant: hand back the closest few, flagged, so the caller can say "no good match".
    return strong.length ? out(strong, false) : out(ranked.slice(0, Math.min(3, limit)), true);
  }

  async function getAsset(id) {
    let doc;
    try {
      doc = await vdb.getDocument({ databaseId, collectionId, documentId: docId(id), queries: [Query.select(['$id', 'metadata'])] });
    } catch (e) {
      if (e?.code === 404) return null;
      throw e;
    }
    let source = null;
    const r = await fetch(`${sourceBase.replace(/\/?$/, '/')}drops/${id}/index.tsx`, { signal: AbortSignal.timeout(8000) });
    if (r.ok) source = await r.text();
    return { ...shape(doc.metadata), source_path: `drops/${id}/index.tsx`, source };
  }

  return { search, getAsset };
}
