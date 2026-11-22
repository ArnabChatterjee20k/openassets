// Freeze a SMIL-animated SVG at time t into a static SVG string.
//
// Serialising an animated <svg> loses its timeline (an <img> of it restarts
// from 0), so we seek the live element, read every animated value back from
// the browser, write those values into a clone as plain attributes, and strip
// the <animate*> elements. The result rasterises deterministically.
const ANIMATIONS = 'animate, animateTransform, animateMotion, set';
const STYLE_ATTRS = new Set(['opacity', 'fill', 'stroke', 'fill-opacity', 'stroke-opacity', 'stroke-width', 'stroke-dasharray', 'd', 'stop-color', 'stop-opacity']);

function animatedValue(el: SVGElement, attr: string): string | null {
  if (STYLE_ATTRS.has(attr)) {
    const v = getComputedStyle(el).getPropertyValue(attr);
    if (!v) return null;
    // Computed `d` comes back as path("..."): unwrap it.
    const m = attr === 'd' ? v.match(/^path\("(.*)"\)$/) : null;
    return m ? m[1] : v;
  }
  const prop = (el as unknown as Record<string, unknown>)[attr.replace(/-([a-z])/g, (_, c) => c.toUpperCase())];
  if (prop && typeof prop === 'object' && 'animVal' in prop) {
    const anim = (prop as { animVal: unknown }).animVal;
    if (anim && typeof anim === 'object' && 'value' in anim) return String((anim as { value: number }).value);
    if (anim && typeof anim === 'object' && 'valueAsString' in anim) return String((anim as { valueAsString: string }).valueAsString);
  }
  return null;
}

const matrixAttr = (m: DOMMatrix) => `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`;

export function bakeSvgAt(svg: SVGSVGElement, t: number, size?: { width: number; height: number }): string {
  svg.pauseAnimations();
  svg.setCurrentTime(t);
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const live = Array.from(svg.querySelectorAll<SVGElement>('*'));
  const baked = Array.from(clone.querySelectorAll<SVGElement>('*'));

  live.forEach((el, i) => {
    const out = baked[i];
    const anims = Array.from(el.children).filter((c) => c.matches(ANIMATIONS));
    if (!anims.length) return;
    for (const a of anims) {
      const attr = a.getAttribute('attributeName');
      if (a.tagName === 'animateTransform' || a.tagName === 'animateMotion') {
        // Local transform including SMIL transforms/motion = parentCTM⁻¹ · CTM.
        const g = el as unknown as SVGGraphicsElement;
        const parent = g.parentNode as unknown as SVGGraphicsElement | null;
        const ctm = g.getCTM?.();
        const pctm = parent?.getCTM?.();
        if (ctm && pctm) out.setAttribute('transform', matrixAttr(DOMMatrix.fromMatrix(pctm).inverse().multiply(DOMMatrix.fromMatrix(ctm))));
      } else if (attr) {
        const v = animatedValue(el, attr);
        if (v !== null) out.setAttribute(attr, v);
      }
    }
  });
  clone.querySelectorAll(ANIMATIONS).forEach((a) => a.remove());
  if (size) {
    clone.setAttribute('width', String(size.width));
    clone.setAttribute('height', String(size.height));
  }
  return new XMLSerializer().serializeToString(clone);
}

/** Rasterise an SVG string onto a canvas (scaled to fill it). */
export async function drawSvg(svgText: string, canvas: HTMLCanvasElement, background?: string) {
  const img = new Image();
  img.src = URL.createObjectURL(new Blob([svgText], { type: 'image/svg+xml' }));
  try {
    await img.decode();
    const ctx = canvas.getContext('2d')!;
    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  } finally {
    URL.revokeObjectURL(img.src);
  }
}
