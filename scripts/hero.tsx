// Renders the README hero image from the real component, so it can't drift from the code.
// Usage: bun scripts/hero.tsx   (writes docs/hero.svg)
import { renderToStaticMarkup } from 'react-dom/server';
import { Thermometer, type ThermometerProps } from '../src/thermometer/Thermometer';

const SIZE = 150;
const GAP = 24;
const PAD = 24;
const LABEL_H = 52;

const base: Partial<ThermometerProps> = { min: 32, max: 250, validRange: { min: 32, max: 350 } };
const cases: { title: string; note: string; props: ThermometerProps }[] = [
  { title: '45°F', note: 'cold', props: { ...base, value: 45 } as ThermometerProps },
  { title: '140°F', note: 'mid scale', props: { ...base, value: 140 } as ThermometerProps },
  { title: '240°F', note: 'near the top', props: { ...base, value: 240 } as ThermometerProps },
  { title: '300°F', note: 'pinned, still valid', props: { ...base, value: 300 } as ThermometerProps },
  { title: '999°F', note: 'out of range', props: { ...base, value: 999 } as ThermometerProps },
  { title: '65°C', note: 'unit="C"', props: { value: 65, min: 0, max: 100, unit: 'C' } },
];

const width = PAD * 2 + cases.length * SIZE + (cases.length - 1) * GAP;
const height = PAD * 2 + SIZE + LABEL_H;

const cells = cases.map((c, i) => {
  const x = PAD + i * (SIZE + GAP);
  // Lift the component's own <svg> out of its <div role="meter"> wrapper and position it in the hero.
  const html = renderToStaticMarkup(<Thermometer size={SIZE} {...c.props} />);
  const svg = html
    .slice(html.indexOf('<svg'), html.lastIndexOf('</svg>') + 6)
    .replace(/<svg\b[^>]*>/, (tag) =>
      tag.replace(/ (width|height)="[^"]*"/g, '').replace(/ style="[^"]*"/, '')
        .replace('<svg', `<svg x="${x}" y="${PAD}" width="${SIZE}" height="${SIZE}"`));
  const cx = x + SIZE / 2;
  const ty = PAD + SIZE + 24;
  return `${svg}
  <text class="t" x="${cx}" y="${ty}" text-anchor="middle">${c.title}</text>
  <text class="n" x="${cx}" y="${ty + 18}" text-anchor="middle">${c.note}</text>`;
});

const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="The Thermometer component at six readings: cold, mid scale, near the top, pinned but valid, out of range, and in Celsius">
  <style>
    :root { color-scheme: light dark; }
    text { font-family: system-ui, -apple-system, 'Segoe UI', sans-serif; fill: light-dark(#1f1f1f, #f5f5f5); }
    .t { font-size: 16px; font-weight: 600; }
    .n { font-size: 13px; fill: light-dark(#595959, #a8a8a8); }
  </style>
  ${cells.join('\n  ')}
</svg>
`;

await Bun.write(new URL('../docs/hero.svg', import.meta.url), out);
console.log(`wrote docs/hero.svg (${width}×${height})`);
