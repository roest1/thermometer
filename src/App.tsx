import { useEffect, useState } from 'react';
import { CodePanel } from './demo/CodePanel';
import { Thermometer, type TemperatureUnit } from './thermometer/Thermometer';
import './App.css';

type Theme = 'system' | 'light' | 'dark';
type Workspace = 'controls' | 'code';

const WORKSPACES: { key: Workspace; label: string }[] = [
  { key: 'controls', label: 'Controls' },
  { key: 'code', label: 'Get the code' },
];

interface Settings {
  value: number;
  min: number;
  max: number;
  validMin: number;
  validMax: number;
}

/** Settings are stored in °F and converted for display. */
const PRESETS = {
  limit: {
    title: 'Full at limit',
    hint: 'Max is set to a 250°F limit, so the tube is full once the limit is reached. Readings up to 350°F are still accepted; above that the column drains and turns gray as a likely sensor fault.',
    settings: { value: 180, min: 32, max: 250, validMin: 32, validMax: 350 },
  },
  linear: {
    title: 'Linear',
    hint: 'The column spans the whole valid range.',
    settings: { value: 180, min: 32, max: 350, validMin: 32, validMax: 350 },
  },
  room: {
    title: 'Room',
    hint: 'A narrow scale for indoor readings.',
    settings: { value: 71, min: 50, max: 95, validMin: -40, validMax: 140 },
  },
} satisfies Record<string, { title: string; hint: string; settings: Settings }>;

type PresetKey = keyof typeof PRESETS;

const SLIDER_FLOOR_F = -40;
const SLIDER_CEIL_F = 400;
/** Smallest allowed width of the scale and valid range, so neither can collapse or invert. */
const MIN_SPAN_F = 1;

/** Slider step in either unit. */
const STEP = 0.5;

/** Rounds to the slider step, so every displayed value is one the slider can hold. */
const snap = (n: number) => Math.round(n / STEP) * STEP;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const toCelsius = (f: number) => ((f - 32) * 5) / 9;
const toFahrenheit = (c: number) => (c * 9) / 5 + 32;

/**
 * Keeps every control inside a working configuration: lower bounds stop just
 * short of their upper bound and vice versa, and everything stays on the slider.
 */
function constrain(key: keyof Settings, f: number, s: Settings): number {
  switch (key) {
    case 'min':
      return clamp(f, SLIDER_FLOOR_F, s.max - MIN_SPAN_F);
    case 'max':
      return clamp(f, s.min + MIN_SPAN_F, SLIDER_CEIL_F);
    case 'validMin':
      return clamp(f, SLIDER_FLOOR_F, s.validMax - MIN_SPAN_F);
    case 'validMax':
      return clamp(f, s.validMin + MIN_SPAN_F, SLIDER_CEIL_F);
    default:
      return clamp(f, SLIDER_FLOOR_F, SLIDER_CEIL_F);
  }
}

/**
 * The JSX a user would paste. Every prop is spelled out, so the snippet
 * reproduces the demo exactly instead of depending on the component's defaults.
 */
function usageSnippet(props: {
  min: number;
  max: number;
  validMin: number;
  validMax: number;
  unit: TemperatureUnit;
  size: number;
  backdrop: boolean;
  showUnit: boolean;
  outline: boolean;
}): string {
  const attrs = [
    'value={reading}',
    `min={${props.min}}`,
    `max={${props.max}}`,
    `validRange={{ min: ${props.validMin}, max: ${props.validMax} }}`,
    `unit="${props.unit}"`,
    `size={${props.size}}`,
    `backdrop={${props.backdrop}}`,
    `showUnit={${props.showUnit}}`,
    `outline={${props.outline}}`,
  ];

  return [
    "import { Thermometer } from './components/Thermometer';",
    '',
    '<Thermometer',
    ...attrs.map((a) => `  ${a}`),
    '/>',
    '',
  ].join('\n');
}

function readStoredTheme(): Theme {
  try {
    const t = localStorage.getItem('thermo-theme');
    return t === 'light' || t === 'dark' ? t : 'system';
  } catch {
    return 'system';
  }
}

export default function App() {
  const [preset, setPreset] = useState<PresetKey | null>('limit');
  const [s, setS] = useState<Settings>(PRESETS.limit.settings);
  const [unit, setUnit] = useState<TemperatureUnit>('F');
  const [size, setSize] = useState(260);
  const [backdrop, setBackdrop] = useState(true);
  const [showUnit, setShowUnit] = useState(true);
  const [outline, setOutline] = useState(false);
  const [theme, setTheme] = useState<Theme>(readStoredTheme);
  const [workspace, setWorkspace] = useState<Workspace>('controls');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') delete root.dataset.theme;
    else root.dataset.theme = theme;
    try {
      localStorage.setItem('thermo-theme', theme);
    } catch {
      /* storage unavailable; the choice just won't persist */
    }
  }, [theme]);

  const show = (f: number) => snap(unit === 'F' ? f : toCelsius(f));
  const set = (key: keyof Settings, markCustom = true) => (v: number) => {
    const f = unit === 'F' ? v : toFahrenheit(v);
    setS((prev) => ({ ...prev, [key]: constrain(key, f, prev) }));
    if (markCustom) setPreset(null);
  };

  const applyPreset = (key: PresetKey) => {
    setPreset(key);
    setS(PRESETS[key].settings);
  };

  const range = { min: show(SLIDER_FLOOR_F), max: show(SLIDER_CEIL_F), unit };

  // What the gauge, sliders, status and snippet all show, in the display unit.
  // Deriving everything from these keeps them from disagreeing after rounding.
  const view: Settings = {
    value: show(s.value),
    min: show(s.min),
    max: show(s.max),
    validMin: show(s.validMin),
    validMax: show(s.validMax),
  };
  const invalid = view.value < view.validMin || view.value > view.validMax;
  const status = invalid
    ? 'Outside the valid range'
    : view.value >= view.max
      ? 'Full'
      : view.value <= view.min
        ? 'Empty'
        : `${Math.round(((view.value - view.min) / (view.max - view.min)) * 100)}% of scale`;

  return (
    <div className="page">
      <header className="masthead">
        <div>
          <h1>Thermometer</h1>
          <p className="lede">
            A thermometer gauge for React with no runtime dependencies. Drag the reading to watch
            the column fill, and move the scale to change where it empties and tops out.
          </p>
        </div>
        <div className="segmented" role="group" aria-label="Color theme">
          {(['system', 'light', 'dark'] as const).map((t) => (
            <button key={t} type="button" aria-pressed={theme === t} onClick={() => setTheme(t)}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <main className="layout">
        <section className="stage" aria-label="Preview">
          <Thermometer
            value={view.value}
            min={view.min}
            max={view.max}
            validRange={{ min: view.validMin, max: view.validMax }}
            unit={unit}
            size={size}
            backdrop={backdrop}
            showUnit={showUnit}
            outline={outline}
          />
          <p className="stage__readout">
            <strong>
              {view.value.toFixed(1)}°{unit}
            </strong>
            <span className={invalid ? 'stage__status stage__status--warn' : 'stage__status'}>
              {status}
            </span>
          </p>
        </section>

        <div className="workspace">
          <div className="tabs workspace__bar" role="tablist" aria-label="Workspace">
            {WORKSPACES.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="tab"
                id={`ws-tab-${key}`}
                aria-selected={workspace === key}
                aria-controls={`ws-${key}`}
                onClick={() => setWorkspace(key)}
              >
                {label}
              </button>
            ))}
          </div>

          <div
            className="workspace__pane"
            id="ws-controls"
            role="tabpanel"
            aria-labelledby="ws-tab-controls"
            hidden={workspace !== 'controls'}
          >
            <section className="panel" aria-label="Controls">
          <Slider label="Reading" value={view.value} onChange={set('value', false)} big {...range} />

          <fieldset>
            <legend>Preset</legend>
            <div className="segmented">
              {(Object.keys(PRESETS) as PresetKey[]).map((key) => (
                <button key={key} type="button" aria-pressed={preset === key} onClick={() => applyPreset(key)}>
                  {PRESETS[key].title}
                </button>
              ))}
            </div>
            <p className="hint">{preset ? PRESETS[preset].hint : 'Custom settings.'}</p>
          </fieldset>

          <fieldset>
            <legend>Scale</legend>
            <Slider label="Min (empty)" value={view.min} onChange={set('min')} {...range} />
            <Slider label="Max (full)" value={view.max} onChange={set('max')} {...range} />
            <p className="hint">Each thumb stops just short of the other, so the scale can't collapse or flip.</p>
          </fieldset>

          <fieldset>
            <legend>Valid reading range</legend>
            <Slider label="Lowest" value={view.validMin} onChange={set('validMin')} {...range} />
            <Slider label="Highest" value={view.validMax} onChange={set('validMax')} {...range} />
          </fieldset>

          <fieldset>
            <legend>Appearance</legend>
            <div className="segmented" role="group" aria-label="Unit">
              {(['F', 'C'] as const).map((u) => (
                <button key={u} type="button" aria-pressed={unit === u} onClick={() => setUnit(u)}>
                  °{u}
                </button>
              ))}
            </div>
            <Slider label="Size" value={size} min={40} max={320} unit="px" onChange={setSize} />
            <div className="toggles">
              <Toggle label="Backdrop" checked={backdrop} onChange={setBackdrop} />
              <Toggle label="Unit glyph" checked={showUnit} onChange={setShowUnit} />
              <Toggle label="Outline" checked={outline} onChange={setOutline} />
            </div>
          </fieldset>
            </section>
          </div>

          {/* Stays mounted while hidden, so the highlighted code and chosen file tab persist. */}
          <div
            className="workspace__pane workspace__pane--code"
            id="ws-code"
            role="tabpanel"
            aria-labelledby="ws-tab-code"
            hidden={workspace !== 'code'}
          >
            <CodePanel
              usage={usageSnippet({
                min: view.min,
                max: view.max,
                validMin: view.validMin,
                validMax: view.validMax,
                unit,
                size,
                backdrop,
                showUnit,
                outline,
              })}
            />
          </div>
        </div>
      </main>

      <footer className="foot">
        Artwork adapted from CC0 icons on{' '}
        <a href="https://www.svgrepo.com" target="_blank" rel="noreferrer">
          SVG Repo
        </a>
        . Code is MIT licensed.
      </footer>
    </div>
  );
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
  big?: boolean;
}

function Slider({ label, value, min, max, unit, onChange, big }: SliderProps) {
  const px = unit === 'px';
  return (
    <label className={big ? 'slider slider--big' : 'slider'}>
      <span className="slider__label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={px ? 1 : STEP}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <output className="slider__value">
        {value.toFixed(px ? 0 : 1)}
        {px ? 'px' : `°${unit}`}
      </output>
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
