import { FONTS, type FontKey } from '@/lib/fonts';
import type { Field } from '@/lib/params';

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function Control({ field, value, onChange }: { field: Field; value: unknown; onChange: (v: unknown) => void }) {
  switch (field.ui) {
    case 'color':
      return (
        <div className="row">
          <input type="color" value={value as string} onChange={(e) => onChange(e.target.value)} />
          <input
            className="mono"
            value={value as string}
            onChange={(e) => /^#[0-9a-fA-F]{6}$/.test(e.target.value) && onChange(e.target.value)}
            size={8}
          />
        </div>
      );
    case 'textarea':
      return <textarea rows={3} value={value as string} onChange={(e) => onChange(e.target.value)} />;
    case 'number':
      return (
        <div className="row">
          <input
            type="range"
            min={field.min}
            max={field.max}
            step={field.step}
            value={value as number}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          <span className="mono value">{value as number}</span>
        </div>
      );
    case 'toggle':
      return <input type="checkbox" checked={value as boolean} onChange={(e) => onChange(e.target.checked)} />;
    case 'select':
      return (
        <div className="segmented">
          {field.options!.map((o) => (
            <button key={o} className={o === value ? 'on' : ''} onClick={() => onChange(o)}>
              {o}
            </button>
          ))}
        </div>
      );
    case 'font':
      return (
        <select value={value as string} onChange={(e) => onChange(e.target.value)}>
          {field.options!.map((o) => (
            <option key={o} value={o} style={{ fontFamily: FONTS[o as FontKey] }}>
              {o}
            </option>
          ))}
        </select>
      );
    case 'image':
      return (
        <div className="row">
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > MAX_IMAGE_BYTES) return alert('Image must be under 8 MB');
              onChange(await readAsDataUrl(file));
            }}
          />
          {value ? (
            <>
              <img className="thumb" src={value as string} alt="" />
              <button onClick={() => onChange('')}>Remove</button>
            </>
          ) : null}
        </div>
      );
    default:
      return <input value={value as string} onChange={(e) => onChange(e.target.value)} />;
  }
}

export function ControlPanel({
  fields,
  values,
  onChange,
}: {
  fields: Field[];
  values: Record<string, unknown>;
  onChange: (key: string, v: unknown) => void;
}) {
  return (
    <div className="controls">
      {fields.map((f) => (
        <label key={f.key} className="control">
          <span className="control-label">{f.label}</span>
          <Control field={f} value={values[f.key]} onChange={(v) => onChange(f.key, v)} />
        </label>
      ))}
    </div>
  );
}
