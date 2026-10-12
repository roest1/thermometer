import { useEffect, useMemo, useRef, useState } from 'react';
import componentSource from '../thermometer/Thermometer.tsx?raw';
import componentReadme from '../thermometer/README.md?raw';
import type { CodeLang, Render } from './render';

type TabKey = 'usage' | 'component' | 'readme';

interface Tab {
  label: string;
  /** Raw text: what Copy puts on the clipboard. */
  code: string;
  lang: CodeLang | 'markdown';
}

// Starts loading as soon as the page does. It's a separate chunk so Shiki
// doesn't delay the first paint of the gauge.
const rendererPromise: Promise<Render | null> = import('./render')
  .then((r) => r.loadRenderer())
  .catch(() => null); // keep the plain-text fallback

/** The renderer once Shiki has loaded, or null until then. */
function useRenderer(): Render | null {
  const [render, setRender] = useState<Render | null>(null);
  useEffect(() => {
    let cancelled = false;
    void rendererPromise.then((r) => {
      if (!cancelled) setRender(() => r);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return render;
}

interface CodePanelProps {
  usage: string;
}

const FILE_NAME = 'Thermometer.tsx';

function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  // Some browsers start the download asynchronously; revoking right away can cancel it.
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API is unavailable on insecure origins and in some embeds.
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

export function CodePanel({ usage }: CodePanelProps) {
  const [tab, setTab] = useState<TabKey>('usage');
  const [copied, setCopied] = useState<'ok' | 'fail' | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const tabs: Record<TabKey, Tab> = {
    usage: { label: 'Usage', code: usage, lang: 'tsx' },
    component: { label: FILE_NAME, code: componentSource, lang: 'tsx' },
    readme: { label: 'README.md', code: componentReadme, lang: 'markdown' },
  };
  const active = tabs[tab];

  // The component and its README never change, so they render once. The usage
  // snippet re-renders only when the settings change it.
  const render = useRenderer();
  const staticHtml = useMemo(
    () => render && { component: render(componentSource, 'tsx'), readme: render(componentReadme, 'markdown') },
    [render],
  );
  const usageHtml = useMemo(() => render?.(usage, 'tsx') ?? null, [render, usage]);
  const html = tab === 'usage' ? usageHtml : (staticHtml?.[tab] ?? null);
  const isMarkdown = active.lang === 'markdown';

  const onCopy = async () => {
    const ok = await copyText(active.code);
    setCopied(ok ? 'ok' : 'fail');
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setCopied(null), 1600);
  };

  const onFile = () =>
    download(new Blob([componentSource], { type: 'text/plain' }), FILE_NAME);

  return (
    <section className="code" aria-label="Get the code">
      <div className="code__head">
        <div>
          <h2>Get the code</h2>
          <p className="hint">
            One file with no dependencies besides React 18+. Copy <code>{FILE_NAME}</code> into your
            project, then paste the usage below. It reflects your current settings.
          </p>
        </div>
        <div className="code__actions">
          <button type="button" className="btn btn--primary" onClick={onFile}>
            Download {FILE_NAME}
          </button>
        </div>
      </div>

      <div className="code__bar">
        <div className="tabs" role="tablist" aria-label="Files">
          {(Object.keys(tabs) as TabKey[]).map((key) => (
            <button
              key={key}
              type="button"
              role="tab"
              id={`tab-${key}`}
              aria-selected={tab === key}
              aria-controls="code-view"
              onClick={() => setTab(key)}
            >
              {tabs[key].label}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn--small" onClick={onCopy} aria-live="polite">
          {copied === 'ok' ? 'Copied' : copied === 'fail' ? 'Copy failed' : isMarkdown ? 'Copy markdown' : 'Copy'}
        </button>
      </div>

      <div
        id="code-view"
        role="tabpanel"
        aria-labelledby={`tab-${tab}`}
        className={isMarkdown ? 'code__view code__view--doc' : 'code__view'}
        tabIndex={0}
      >
        {html ? (
          // Shiki escapes code; the Markdown is this repo's own README.
          <div className="code__html" dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <pre className={isMarkdown ? 'code__plain code__plain--wrap' : 'code__plain'}>
            <code>{active.code}</code>
          </pre>
        )}
      </div>
    </section>
  );
}
