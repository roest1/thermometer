/**
 * Thermometer: a temperature gauge for React. Self-contained: no CSS file,
 * no dependencies besides React 18+.
 *
 * Artwork adapted from two CC0 (public domain) icons on SVG Repo:
 * "thermometer" (svgrepo.com/svg/37604) and "fahrenheit meausre"
 * (svgrepo.com/svg/22344). Code: MIT License.
 *
 * Every prop is sanitized, so no combination of inputs breaks the render:
 * a reversed range is swapped, a non-finite bound falls back to its default,
 * a bad size falls back to 150, and an unknown unit falls back to °F.
 */
import { useId, type CSSProperties } from 'react';

export type TemperatureUnit = 'F' | 'C';

export interface Range {
  min: number;
  max: number;
}

export interface ThermometerProps {
  /** Current reading, in `unit`. Non-finite values are treated as "no reading". */
  value: number;
  /** Reading at which the column is empty. Default 32. */
  min?: number;
  /** Reading at which the tube is full. Default 212. */
  max?: number;
  /**
   * Readings outside this range are treated as implausible (a faulty sensor,
   * a unit mix-up): the column drains and turns gray. Separate from
   * `min`/`max`, which only set the visual scale.
   */
  validRange?: Range;
  /** Selects the unit glyph and labels. No conversion is done. Default 'F'. */
  unit?: TemperatureUnit;
  /** Width and height in px. Default 150. */
  size?: number;
  /** Circular backdrop. Default true. */
  backdrop?: boolean;
  /** Unit glyph beside the tube. Default true. */
  showUnit?: boolean;
  /** Stroke around the glass; helps at small sizes without a backdrop. Default false. */
  outline?: boolean;
  /** Accessible name. Default "Temperature". */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

/* ---- Geometry (473.935 x 473.935 viewBox) ------------------------------- */

const VIEWBOX = 473.935;
const RADIUS = VIEWBOX / 2;

const GLASS_PATH =
  'M166.738,277.169V94.794c0-13.893-11.263-25.171-25.171-25.171c-13.901,0-25.164,11.278-25.164,25.171' +
  'v182.371c-24,9.908-40.898,33.508-40.898,61.066c0,36.475,29.583,66.046,66.058,66.046' +
  'c36.467,0,66.058-29.571,66.058-66.046C207.628,310.677,190.719,287.066,166.738,277.169z';

// The source icon's red column stopped at y=195.374; extended to y=94 so the
// mercury can travel the full tube.
const BORE_PATH =
  'M158.723,319.68V94c0-9.467-7.682-17.152-17.152-17.152c-9.463,0-17.152,7.686-17.152,17.152' +
  'V319.68C108.07,326.434,175.071,326.426,158.723,319.68z';

const BULB = { cx: 141.619, cy: 339.193, r: 59.805 };

const TICKS_PATH =
  'M124.463,100.572v9.145h21.998v-9.145C146.461,100.572,124.463,100.572,124.463,100.572z' +
  'M124.463,140.246h28.569v-9.152h-28.569L124.463,140.246L124.463,140.246z' +
  'M124.463,170.775h21.998v-9.164h-21.998V170.775z' +
  'M124.463,201.544h28.569v-9.149h-28.569L124.463,201.544L124.463,201.544z' +
  'M124.463,263.934h28.569v-9.149h-28.569L124.463,263.934L124.463,263.934z' +
  'M124.463,232.073h21.998v-9.164h-21.998V232.073z' +
  // Glossy highlight on the bulb.
  'M97.881,344.54c-8.666-8.655,0.842-32.636,9.5-41.291c8.658-8.659,29.62-16.879,38.278-8.217' +
  'C154.323,303.687,106.536,353.202,97.881,344.54z';

/** Column travel: `EMPTY` is where the bulb meets the tube, `FULL` the top of the bore. */
const COLUMN_EMPTY = BULB.cy - BULB.r;
const COLUMN_FULL = 76.848;
const COLUMN_FLOOR = BULB.cy + BULB.r;

const UNIT_GLYPHS: Record<TemperatureUnit, { transform: string; d: string }> = {
  F: {
    transform: 'translate(240, 100)',
    d:
      'M25.553,5.496C11.46,5.496,0,16.962,0,31.054c0,14.103,11.46,25.553,25.553,25.553' +
      's25.558-11.455,25.558-25.553C51.111,16.962,39.645,5.496,25.553,5.496z' +
      'M25.553,43.836c-7.049,0-12.776-5.733-12.776-12.782c0-7.038,5.727-12.782,12.776-12.782' +
      's12.782,5.744,12.782,12.782C38.335,38.103,32.602,43.836,25.553,43.836z' +
      'M127.122,34.323V14.454H61.766v107.171h24.171V78.537h38.481V58.815H85.937V34.323H127.122z',
  },
  C: {
    transform: 'translate(240, 104) scale(0.66) translate(-205.6, -146.45)',
    d:
      'M360.91,258.797l37.493,11.33c-2.522,10.518-6.481,19.296-11.899,26.35' +
      'c-5.414,7.05-12.138,12.374-20.172,15.959c-8.026,3.592-18.241,5.388-30.642,5.388' +
      'c-15.042,0-27.341-2.189-36.875-6.559c-9.538-4.374-17.773-12.067-24.696-23.076' +
      'c-6.93-11.016-10.391-25.107-10.391-42.29c0-22.9,6.095-40.505,18.279-52.797' +
      'c12.183-12.31,29.422-18.454,51.704-18.454c17.444,0,31.147,3.525,41.13,10.574' +
      'c9.976,7.053,17.392,17.882,22.237,32.49l-37.777,8.404c-1.325-4.221-2.705-7.304-4.15-9.253' +
      'c-2.398-3.274-5.321-5.792-8.793-7.558c-3.457-1.766-7.33-2.645-11.607-2.645' +
      'c-9.699,0-17.13,3.903-22.297,11.697c-3.903,5.785-5.852,14.874-5.852,27.263' +
      'c0,15.345,2.331,25.856,6.986,31.551c4.662,5.695,11.21,8.535,19.644,8.535' +
      'c8.187,0,14.376-2.294,18.563-6.892C355.979,274.221,359.017,267.545,360.91,258.797z' +
      'M234.434,146.45c-15.925,0-28.838,12.909-28.838,28.838c0,15.933,12.913,28.842,28.838,28.842' +
      's28.838-12.909,28.838-28.842C263.272,159.359,250.359,146.45,234.434,146.45z' +
      'M234.434,194.094c-10.383,0-18.802-8.419-18.802-18.806s8.419-18.806,18.802-18.806' +
      's18.81,8.419,18.81,18.806S244.821,194.094,234.434,194.094z',
  },
};

/*
 * Colors. Override any of these custom properties on an ancestor to theme it.
 * The themed defaults follow the CSS `color-scheme` of the page via
 * light-dark(). Browsers without light-dark() get the light colors instead,
 * which is why those defaults live in an @supports block rather than inline
 * styles: an unsupported value inside var() would make the fill black.
 */
const STYLESHEET =
  '.thermo-backdrop{fill:var(--thermo-backdrop,#bdbdbd)}' +
  '.thermo-unit{fill:var(--thermo-unit,#1f1f1f)}' +
  '.thermo-glass{fill:var(--thermo-glass,#ffffff);stroke:var(--thermo-outline,#000000)}' +
  '.thermo-ticks{fill:var(--thermo-ticks,#f59c9e)}' +
  '.thermo-mercury{fill:var(--thermo-mercury,#8b1414)}' +
  '.thermo-invalid{fill:var(--thermo-invalid,#9e9e9e)}' +
  '@supports (color:light-dark(#000,#fff)){' +
  '.thermo-backdrop{fill:var(--thermo-backdrop,light-dark(#bdbdbd,#3d3c3a))}' +
  '.thermo-unit{fill:var(--thermo-unit,light-dark(#1f1f1f,#f5f5f5))}' +
  '.thermo-mercury{fill:var(--thermo-mercury,light-dark(#8b1414,#ff746c))}' +
  '}';

/* ---- Pure helpers --------------------------------------------------------- */

const DEFAULT_SCALE: Range = { min: 32, max: 212 };
const DEFAULT_SIZE = 150;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Fills non-finite bounds from `fallback` and swaps a reversed range. */
function normalizeRange(min: unknown, max: unknown, fallback: Range): Range {
  const lo = typeof min === 'number' && Number.isFinite(min) ? min : fallback.min;
  const hi = typeof max === 'number' && Number.isFinite(max) ? max : fallback.max;
  return lo <= hi ? { min: lo, max: hi } : { min: hi, max: lo };
}

/** Fraction of the tube that is filled, 0..1. A zero-width scale is a step at `max`. */
function fillRatio(value: number, { min, max }: Range): number {
  if (!Number.isFinite(value)) return 0;
  if (max === min) return value >= max ? 1 : 0;
  return clamp((value - min) / (max - min), 0, 1);
}

/* ---- Component -------------------------------------------------------------- */

export function Thermometer({
  value,
  min,
  max,
  validRange,
  unit,
  size,
  backdrop = true,
  showUnit = true,
  outline = false,
  label = 'Temperature',
  className,
  style,
}: ThermometerProps) {
  // useId output can contain characters that are awkward inside url(#…).
  const clipId = `thermo-bore-${useId().replace(/[^\w-]/g, '')}`;

  const scale = normalizeRange(min, max, DEFAULT_SCALE);
  const valid = validRange
    ? normalizeRange(validRange.min, validRange.max, { min: -Infinity, max: Infinity })
    : undefined;
  const glyphUnit: TemperatureUnit = unit === 'C' ? 'C' : 'F';
  const px = typeof size === 'number' && Number.isFinite(size) && size > 0 ? size : DEFAULT_SIZE;

  const finite = Number.isFinite(value);
  const invalid = !finite || (valid !== undefined && (value < valid.min || value > valid.max));

  // An implausible reading has no meaningful height, so the column drains.
  const ratio = invalid ? 0 : fillRatio(value, scale);
  const columnY = COLUMN_EMPTY - ratio * (COLUMN_EMPTY - COLUMN_FULL);

  const reading = finite ? `${value.toFixed(1)}°${glyphUnit}` : 'No reading';
  const glyph = UNIT_GLYPHS[glyphUnit];

  return (
    <div
      className={className}
      style={{ display: 'inline-block', maxWidth: '100%', lineHeight: 0, ...style }}
      role="meter"
      aria-label={label}
      aria-valuemin={scale.min}
      aria-valuemax={scale.max}
      // A meter requires a value; with no reading, the empty column is the honest one.
      aria-valuenow={finite ? clamp(value, scale.min, scale.max) : scale.min}
      aria-valuetext={finite && invalid ? `${reading}, outside the valid range` : reading}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={px}
        height={px}
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        // Shrinks to fit a narrower container instead of overflowing it.
        style={{ display: 'block', maxWidth: '100%', height: 'auto' }}
        aria-hidden="true"
        focusable="false"
      >
        <style>{STYLESHEET}</style>

        {backdrop && <circle className="thermo-backdrop" cx={RADIUS} cy={RADIUS} r={RADIUS} />}

        {showUnit && <path className="thermo-unit" transform={glyph.transform} d={glyph.d} />}

        <g transform="translate(50, 10)">
          <path
            className="thermo-glass"
            d={GLASS_PATH}
            strokeWidth={outline ? 2 : 0}
            strokeLinejoin="round"
          />

          <defs>
            <clipPath id={clipId}>
              <path d={BORE_PATH} />
              <circle cx={BULB.cx} cy={BULB.cy} r={BULB.r} />
            </clipPath>
          </defs>

          <rect
            className={invalid ? 'thermo-invalid' : 'thermo-mercury'}
            x={0}
            width={VIEWBOX}
            y={columnY}
            height={COLUMN_FLOOR - columnY}
            clipPath={`url(#${clipId})`}
          />

          <path className="thermo-ticks" d={TICKS_PATH} />
        </g>
      </svg>
    </div>
  );
}
