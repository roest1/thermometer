# Thermometer

A temperature gauge for React in a single file.

## Requirements

- React 18 or newer.
- TypeScript is optional. The file is `.tsx`; in a JavaScript project, rename it to `.jsx` and delete the type annotations.
- Nothing else: no CSS file, no other packages.

## Install

1. Copy `Thermometer.tsx` into your project, for example `src/components/Thermometer.tsx`.
2. Import it and render it:

```tsx
import { Thermometer } from './components/Thermometer';

export function SensorCard({ reading }: { reading: number }) {
  return <Thermometer value={reading} min={32} max={250} validRange={{ min: 32, max: 350 }} />;
}
```

In the Next.js App Router, the component runs in both server and client components because it uses no state or effects.

## Props

| Prop | Default | |
| --- | --- | --- |
| `value` | required | Current reading, in `unit`. `NaN` or `Infinity` is treated as no reading. |
| `min` | `32` | Reading at which the column is empty. |
| `max` | `212` | Reading at which the tube is full. |
| `validRange` | none | `{ min, max }` of plausible readings. Outside it, the column drains and turns gray. |
| `unit` | `'F'` | `'F'` or `'C'`. Selects the glyph only; no conversion is done. |
| `size` | `150` | Width and height in px. In a narrower container, it shrinks to fit. |
| `backdrop` | `true` | Circular background. |
| `showUnit` | `true` | Unit glyph beside the tube. |
| `outline` | `false` | Stroke around the glass. Helps at small sizes without a backdrop. |
| `label` | `'Temperature'` | Accessible name, read out with the value. |
| `className`, `style` | | Applied to the wrapper. |

### Scale and valid range are separate settings

`min`/`max` only set where the tube is empty and full. A reading outside them pins the column at the bottom or top. `validRange` decides which readings are believable at all. Keeping the two apart lets the tube top out at a limit while higher readings still count, and readings far past it are flagged as sensor faults.

### Bad input does not break the render

- A reversed range is swapped.
- A non-finite bound falls back to its default.
- When `min === max`, the tube switches from empty to full at that value.
- A size that is zero, negative, or non-finite falls back to 150.
- An unknown unit falls back to `'F'`.

## Theming

Colors are CSS custom properties with built-in defaults. Set any of them on an ancestor:

```css
.dashboard {
  --thermo-mercury: #0a84ff;
  --thermo-backdrop: transparent;
}
```

| Property | Light / dark default |
| --- | --- |
| `--thermo-backdrop` | `#bdbdbd` / `#3d3c3a` |
| `--thermo-unit` | `#1f1f1f` / `#f5f5f5` |
| `--thermo-mercury` | `#8b1414` / `#ff746c` |
| `--thermo-glass` | `#ffffff` |
| `--thermo-outline` | `#000000` |
| `--thermo-ticks` | `#f59c9e` |
| `--thermo-invalid` | `#9e9e9e` |

The light and dark defaults follow the page's CSS `color-scheme` through `light-dark()`. If your app has a dark mode but does not set `color-scheme: dark`, either set it (`:root.dark { color-scheme: dark; }`) or override the properties yourself. Browsers without `light-dark()` (Safari before 17.5, Chrome before 123) always get the light defaults.

The colors are applied through a small `<style>` element inside the SVG, using classes prefixed with `thermo-`. Avoid reusing those class names elsewhere on the page.

## License

The code is under the MIT License. The artwork is adapted from CC0 (public domain) icons on SVG Repo: [thermometer](https://www.svgrepo.com/svg/37604/thermometer) and [Fahrenheit](https://www.svgrepo.com/svg/22344/fahrenheit-meausre).
