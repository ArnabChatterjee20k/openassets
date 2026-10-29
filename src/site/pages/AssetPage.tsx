import { useMemo, useRef, useState } from 'react';
import { describeFields } from '@/lib/params';
import { BANNER_SIZES, KIND_LABELS, resolveParams, variantNames, type AssetModule } from '@/lib/types';
import { AssetView } from '@/renderers/AssetView';
import type { Angle, MotionMode, SceneHandle } from '@/renderers/Scene3D';
import { canvasToPng, download, iconSvg, nodeToPng, sceneToGlb, slugify, svgToPng } from '@/renderers/export';
import { ControlPanel } from '../editor/ControlPanel';
import { href, replaceQuery } from '../router';
import { useAsset } from '../useAsset';
import { dropInfo } from '@/lib/registry';

export function AssetPage({ id, query }: { id: string; query: URLSearchParams }) {
  const { mod, error } = useAsset(id);
  if (error) return <p>{error}</p>;
  if (!mod) return <div className="skeleton tall" />;
  return <Editor id={id} mod={mod} query={query} />;
}

/** Params encoded in the URL: everything except uploaded images (too large). */
function decodeOverrides(query: URLSearchParams): Record<string, unknown> {
  try {
    return JSON.parse(query.get('p') ?? '{}');
  } catch {
    return {};
  }
}

function Editor({ id, mod, query }: { id: string; mod: AssetModule; query: URLSearchParams }) {
  const fields = useMemo(() => describeFields(mod.schema), [mod]);
  const variants = variantNames(mod);
  const [variant, setVariant] = useState(() => (variants.includes(query.get('v') ?? '') ? query.get('v')! : 'default'));
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const parsed = mod.schema.safeParse({ ...resolveParams(mod, variant), ...decodeOverrides(query) });
    return parsed.success ? parsed.data : resolveParams(mod, variant);
  });
  const [bannerSize, setBannerSize] = useState('og');
  const [angle, setAngle] = useState<Angle>('iso');
  const [motion, setMotion] = useState<MotionMode>('default');
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState('');
  const nodeRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneHandle | null>(null);
  const [date, dir, slug] = id.split('/');
  const name = slugify(mod.meta.name);

  const sync = (v: string, vals: Record<string, unknown>) => {
    const base = resolveParams(mod, v);
    const diff = Object.fromEntries(
      fields.filter((f) => f.ui !== 'image' && vals[f.key] !== base[f.key]).map((f) => [f.key, vals[f.key]]),
    );
    replaceQuery(`/asset/${id}`, { v, ...(Object.keys(diff).length ? { p: JSON.stringify(diff) } : {}) });
  };

  const pickVariant = (v: string) => {
    // Keep uploaded images when switching variants.
    const images = Object.fromEntries(fields.filter((f) => f.ui === 'image').map((f) => [f.key, values[f.key]]));
    const next = { ...resolveParams(mod, v), ...images };
    setVariant(v);
    setValues(next);
    sync(v, next);
  };

  const change = (key: string, v: unknown) => {
    const next = { ...values, [key]: v };
    setValues(next);
    sync(variant, next);
  };

  const flash = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(''), 2000);
  };

  const exports: { label: string; run: () => Promise<void> | void }[] = [];
  if (mod.meta.kind === 'icon') {
    exports.push(
      { label: 'SVG', run: () => download(new Blob([iconSvg(mod, values)], { type: 'image/svg+xml' }), `${name}.svg`) },
      { label: 'PNG 512', run: async () => download(await svgToPng(iconSvg(mod, values, 512), 512), `${name}-512.png`) },
      { label: 'PNG 64', run: async () => download(await svgToPng(iconSvg(mod, values, 64), 64), `${name}-64.png`) },
      {
        label: 'Copy SVG',
        run: async () => {
          await navigator.clipboard.writeText(iconSvg(mod, values));
          flash('SVG copied');
        },
      },
    );
  } else if (mod.meta.kind === 'icon3d') {
    exports.push(
      {
        label: 'PNG',
        run: async () => {
          const canvas = nodeRef.current?.querySelector('canvas');
          if (canvas) download(await canvasToPng(canvas), `${name}-${angle}.png`);
        },
      },
      {
        label: 'GLB',
        run: async () => {
          if (!sceneRef.current) return;
          download(new Blob([await sceneToGlb(sceneRef.current.scene)], { type: 'model/gltf-binary' }), `${name}.glb`);
        },
      },
    );
  } else if (mod.meta.kind === 'scene') {
    const sc = mod.scene!;
    const sceneSvg = () => iconSvg(mod, values).replace(/<svg width="\d+" height="\d+"/, `<svg width="${sc.width}" height="${sc.height}"`);
    exports.push(
      { label: 'Animated SVG', run: () => download(new Blob([sceneSvg()], { type: 'image/svg+xml' }), `${name}.svg`) },
      {
        label: 'PNG',
        run: async () => {
          // Rasterise at 2x via an offscreen canvas (shows the scene's resting frame).
          const img = new Image();
          img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(sceneSvg())}`;
          await img.decode();
          const c = document.createElement('canvas');
          c.width = sc.width * 2;
          c.height = sc.height * 2;
          c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
          download(await canvasToPng(c), `${name}.png`);
        },
      },
    );
  } else if (mod.meta.kind === 'banner') {
    exports.push({
      label: `PNG ${BANNER_SIZES[bannerSize].width}×${BANNER_SIZES[bannerSize].height}`,
      run: async () => {
        if (nodeRef.current) download(await nodeToPng(nodeRef.current), `${name}-${bannerSize}.png`);
      },
    });
  } else {
    exports.push({
      label: 'props.json',
      run: () => download(new Blob([JSON.stringify(values, null, 2)], { type: 'application/json' }), `${name}.props.json`),
    });
  }
  exports.push({
    label: 'Copy link',
    run: async () => {
      await navigator.clipboard.writeText(window.location.href);
      flash('Link copied (uploaded images are not included)');
    },
  });

  const kind = mod.meta.kind;
  return (
    <div className="editor">
      <div className="editor-main">
        <div className="crumbs muted">
          <a href={href(`/kit/${date}`)}>{dropInfo(date)?.theme ?? date}</a> / {KIND_LABELS[kind]}
        </div>
        <h1 className="display-md">
          {mod.meta.name} {mod.meta.category && <span className="chip">{mod.meta.category}</span>}
        </h1>
        {mod.meta.description && <p className="muted">{mod.meta.description}</p>}

        <div className={`stage stage-${kind}`}>
          <AssetView
            mod={mod}
            params={values}
            opts={{ interactive: true, bannerSize, angle, motion, paused, nodeRef, onSceneReady: (h) => (sceneRef.current = h) }}
          />
        </div>

        <div className="toolbar">
          {kind === 'banner' && (
            <div className="segmented">
              {Object.entries(BANNER_SIZES).map(([k, s]) => (
                <button key={k} className={k === bannerSize ? 'on' : ''} onClick={() => setBannerSize(k)} title={`${s.width}×${s.height}`}>
                  {k}
                </button>
              ))}
            </div>
          )}
          {kind === 'icon3d' && (
            <div className="segmented">
              {(['front', 'iso', 'side'] as Angle[]).map((a) => (
                <button key={a} className={a === angle ? 'on' : ''} onClick={() => setAngle(a)}>
                  {a}
                </button>
              ))}
            </div>
          )}
          {kind === 'scene' && (
            <div className="segmented">
              <button className={paused ? '' : 'on'} onClick={() => setPaused(!paused)}>
                {paused ? 'play' : 'playing'}
              </button>
              <span className="muted hint">SMIL animation · exports as a self-playing .svg</span>
            </div>
          )}
          {kind === 'icon3d' && (
            <div className="segmented">
              {(['default', 'interaction'] as MotionMode[]).map((m) => (
                <button
                  key={m}
                  className={m === motion ? 'on' : ''}
                  onClick={() => setMotion(m)}
                  title={m === 'default' ? 'Rest pose; animates on hover/click' : 'Play the interaction loop continuously'}
                >
                  {m}
                </button>
              ))}
              <span className="muted hint">{motion === 'default' ? 'hover or click the icon to play' : 'looping'} · drag to orbit</span>
            </div>
          )}
        </div>

        <h3>Variants</h3>
        <div className="segmented wrap">
          {variants.map((v) => (
            <button key={v} className={v === variant ? 'on' : ''} onClick={() => pickVariant(v)}>
              {v}
            </button>
          ))}
        </div>

        {kind === 'video' && (
          <div className="note">
            <strong>Render this video locally:</strong> download <code>props.json</code>, then run
            <pre>
              pnpm render:video {date}/{dir}/{slug} --props {name}.props.json
            </pre>
          </div>
        )}
      </div>

      <aside className="editor-side">
        <h3>Edit</h3>
        <ControlPanel fields={fields} values={values} onChange={change} />
        <button className="ghost" onClick={() => pickVariant(variant)}>
          Reset to “{variant}”
        </button>
        <h3>Export</h3>
        <div className="exports">
          {exports.map((e, i) => (
            <button key={e.label} className={i === 0 ? 'primary' : ''} onClick={() => e.run()}>
              {e.label}
            </button>
          ))}
        </div>
        {status && <div className="status">{status}</div>}
      </aside>
    </div>
  );
}
