'use client';

import { type ReactNode } from 'react';

/**
 * Lightweight Markdown-ish renderer for chat messages. Supports:
 *   - **bold**        →  <strong>
 *   - *italic*        →  <em>
 *   - `code`          →  <code>
 *   - bare URLs       →  clickable <a target="_blank">
 *   - line breaks     →  <br />
 *
 * Intentionally tiny — we only need what the LLM tends to use in replies,
 * and we never trust raw HTML. All output is plain React text/elements, so
 * there's no XSS risk.
 */
export function MarkdownLite({ text, className }: { text: string; className?: string }) {
  return <span className={className}>{render(text)}</span>;
}

function render(input: string): ReactNode[] {
  const lines = input.split(/\n/);
  const out: ReactNode[] = [];
  lines.forEach((line, i) => {
    out.push(<span key={`l-${i}`}>{renderInline(line)}</span>);
    if (i < lines.length - 1) out.push(<br key={`br-${i}`} />);
  });
  return out;
}

/** Render a single line, splitting on bold/italic/code/URL tokens. */
function renderInline(line: string): ReactNode[] {
  // Token grammar (matched in order):
  //   1) **bold**
  //   2) __bold__
  //   3) *italic*  (but not part of an unmatched single *)
  //   4) `code`
  //   5) URLs starting with http(s)://
  const re = /(\*\*[^*\n]+\*\*|__[^_\n]+__|`[^`\n]+`|\*[^*\n]+\*|https?:\/\/[^\s)<>]+)/g;
  const parts: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) parts.push(<span key={`t-${i++}`}>{line.slice(last, m.index)}</span>);
    const tok = m[0];
    if (tok.startsWith('**') && tok.endsWith('**')) {
      parts.push(<strong key={`b-${i++}`} className="font-semibold">{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith('__') && tok.endsWith('__')) {
      parts.push(<strong key={`b-${i++}`} className="font-semibold">{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith('`') && tok.endsWith('`')) {
      parts.push(<code key={`c-${i++}`} className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.85em]">{tok.slice(1, -1)}</code>);
    } else if (tok.startsWith('*') && tok.endsWith('*')) {
      parts.push(<em key={`i-${i++}`} className="italic">{tok.slice(1, -1)}</em>);
    } else if (/^https?:\/\//.test(tok)) {
      parts.push(
        <a
          key={`a-${i++}`}
          href={tok}
          target="_blank"
          rel="noreferrer noopener"
          className="underline decoration-current/40 underline-offset-2 hover:decoration-current"
        >
          {tok}
        </a>,
      );
    } else {
      parts.push(<span key={`x-${i++}`}>{tok}</span>);
    }
    last = m.index + tok.length;
  }
  if (last < line.length) parts.push(<span key={`tend-${i++}`}>{line.slice(last)}</span>);
  return parts;
}
