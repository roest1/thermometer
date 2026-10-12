/**
 * Syntax highlighting and Markdown rendering for the code panel. Kept in its
 * own chunk so Shiki and its grammars don't delay the first paint, and never
 * shipped with the component itself.
 */
import { Marked } from 'marked';
import { createHighlighterCore, type HighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

export type CodeLang = 'tsx' | 'css';

const LANGS = new Set<string>(['tsx', 'css']);
const LANG_ALIASES: Record<string, CodeLang> = { ts: 'tsx', jsx: 'tsx', js: 'tsx' };


function toHtml(h: HighlighterCore, code: string, lang: string | undefined) {
  const resolved = lang && (LANG_ALIASES[lang] ?? lang);
  return h.codeToHtml(code, {
    lang: resolved && LANGS.has(resolved) ? resolved : 'text',
    themes: { light: 'github-light', dark: 'github-dark' },
    // Follows the page's color-scheme, which the theme switcher sets.
    defaultColor: 'light-dark()',
  });
}

/** Renders a tab's text to HTML: highlighted code, or Markdown for the README. */
export type Render = (code: string, lang: CodeLang | 'markdown') => string;

/** Loads Shiki once; rendering after that is synchronous. */
export async function loadRenderer(): Promise<Render> {
  const h = await createHighlighterCore({
    themes: [import('shiki/themes/github-light.mjs'), import('shiki/themes/github-dark.mjs')],
    langs: [import('shiki/langs/tsx.mjs'), import('shiki/langs/css.mjs')],
    engine: createJavaScriptRegexEngine(),
  });
  return (code, lang) => (lang === 'markdown' ? renderMarkdown(h, code) : toHtml(h, code, lang));
}

/**
 * Renders Markdown to HTML with highlighted code blocks. Only used on the
 * repo's own README (trusted, bundled at build time), so the output is not sanitized.
 */
function renderMarkdown(h: HighlighterCore, markdown: string): string {
  const marked = new Marked({
    gfm: true,
    renderer: {
      code: ({ text, lang }) => toHtml(h, text, lang?.trim().split(/\s+/)[0]),
      link({ href, title, tokens }) {
        const label = this.parser.parseInline(tokens);
        const external = /^https?:\/\//.test(href);
        const t = title ? ` title="${title}"` : '';
        return `<a href="${href}"${t}${external ? ' target="_blank" rel="noreferrer"' : ''}>${label}</a>`;
      },
    },
  });
  return marked.parse(markdown, { async: false });
}
