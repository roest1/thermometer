import { describe, expect, test } from 'bun:test';
import { renderToStaticMarkup } from 'react-dom/server';
import { Thermometer, type ThermometerProps } from '../src/thermometer/Thermometer';

// Column geometry from the component: empty at the top of the bulb, full at the top of the bore.
const EMPTY_Y = 339.193 - 59.805;
const FULL_Y = 76.848;

const render = (props: Partial<ThermometerProps> | Record<string, unknown>) =>
  renderToStaticMarkup(<Thermometer value={70} {...(props as object)} />);

const attr = (html: string, name: string) => html.match(new RegExp(`${name}="([^"]*)"`))?.[1];

/** Fraction of the tube that is filled, read back from the mercury rect. */
const fill = (html: string) => {
  const y = Number(html.match(/<rect[^>]* y="([^"]+)"/)?.[1]);
  return Math.round(((EMPTY_Y - y) / (EMPTY_Y - FULL_Y)) * 1000) / 1000;
};

describe('scale', () => {
  test('is linear inside the scale', () => {
    expect(fill(render({ value: 50, min: 0, max: 100 }))).toBe(0.5);
  });
  test('pins outside the scale', () => {
    expect(fill(render({ value: -10, min: 0, max: 100 }))).toBe(0);
    expect(fill(render({ value: 110, min: 0, max: 100 }))).toBe(1);
  });
  test('swaps a reversed scale', () => {
    const html = render({ value: 25, min: 100, max: 0 });
    expect(attr(html, 'aria-valuemin')).toBe('0');
    expect(attr(html, 'aria-valuemax')).toBe('100');
    expect(fill(html)).toBe(0.25);
  });
  test('treats a zero-width scale as a step', () => {
    expect(fill(render({ value: 49, min: 50, max: 50 }))).toBe(0);
    expect(fill(render({ value: 50, min: 50, max: 50 }))).toBe(1);
  });
  test('replaces non-finite bounds with the defaults', () => {
    const html = render({ min: NaN, max: Infinity });
    expect(attr(html, 'aria-valuemin')).toBe('32');
    expect(attr(html, 'aria-valuemax')).toBe('212');
  });
  test('reorders after filling in a default', () => {
    const html = render({ min: 500 });
    expect(attr(html, 'aria-valuemin')).toBe('212');
    expect(attr(html, 'aria-valuemax')).toBe('500');
  });
});

describe('hostile props', () => {
  const cases: Record<string, unknown>[] = [
    { min: 100, max: 0 },
    { min: 50, max: 50 },
    { min: NaN, max: Infinity },
    { min: '5', max: null },
    { size: 0 },
    { size: -20 },
    { size: NaN },
    { size: '200' },
    { unit: 'K' },
    { value: NaN },
    { value: Infinity },
    { validRange: { min: 200, max: -100 } },
    { validRange: { min: NaN, max: NaN } },
  ];

  const name = (p: Record<string, unknown>) =>
    JSON.stringify(p, (_, v) => (typeof v === 'number' && !Number.isFinite(v) ? String(v) : v));

  for (const props of cases) {
    test(`renders a valid SVG with ${name(props)}`, () => {
      const html = render(props);
      expect(html).toContain('<svg');
      expect(html).not.toMatch(/NaN|Infinity|undefined/);
    });
  }

  test('falls back to the default size', () => {
    expect(render({ size: -5 })).toContain('width="150"');
  });

  test('swaps a reversed valid range', () => {
    expect(render({ value: 70, validRange: { min: 200, max: -100 } })).toContain('class="thermo-mercury"');
  });
});

describe('Thermometer', () => {
  test('drains and grays an implausible reading', () => {
    const html = render({ value: 400, validRange: { min: 0, max: 350 } });
    expect(html).toContain('outside the valid range');
    expect(html).toContain('class="thermo-invalid"');
    expect(fill(html)).toBe(0);
  });

  test('keeps aria-valuenow without a reading, as role="meter" requires', () => {
    const html = render({ value: NaN, min: 10, max: 90 });
    expect(attr(html, 'aria-valuenow')).toBe('10');
    expect(attr(html, 'aria-valuetext')).toBe('No reading');
  });

  test('gives light-dark() colors a plain fallback for browsers without it', () => {
    const css = render({}).match(/<style>(.*?)<\/style>/)?.[1] ?? '';
    const [plain, supported] = css.split('@supports');
    expect(plain).not.toContain('light-dark');
    expect(supported).toContain('light-dark');
  });

  test('gives each instance its own clip path', () => {
    const html = renderToStaticMarkup(
      <>
        <Thermometer value={10} />
        <Thermometer value={90} />
      </>,
    );
    const ids = [...html.matchAll(/clipPath id="([^"]+)"/g)].map((m) => m[1]);
    expect(new Set(ids).size).toBe(2);
  });
});
