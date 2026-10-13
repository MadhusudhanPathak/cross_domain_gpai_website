import { useId, useMemo, useState, type ReactNode } from "react";
import { termFinder, termSlug, type TermEntry } from "../utils/terms";

type Linker = {
  find: (text: string, used: Set<number>) => { start: number; end: number; entry: number }[];
  used: Set<number>;
  open: number | null;
  toggle: (entry: number) => void;
  defId: string;
};

/**
 * Renders a small markdown subset: blank-line paragraphs, "- " bullet lists, **bold** and [text](https://...) links.
 * With `terms`, the first mention of each term becomes a button that shows its definition below the text.
 */
export function MarkdownLite({ text, terms, referenceHref }: { text: string; terms?: TermEntry[]; referenceHref?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const defId = useId();
  const find = useMemo(() => (terms ? termFinder(terms) : null), [terms]);
  const linker: Linker | null = find
    ? { find, used: new Set(), open, toggle: (i) => setOpen((cur) => (cur === i ? null : i)), defId }
    : null;

  const blocks = text.trim().split(/\n\s*\n/);
  const openEntry = open !== null ? terms?.[open] : undefined;
  return (
    <div className="markdown-lite">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim());
        const isList = lines.every((l) => l.startsWith("- "));
        if (isList) {
          return (
            <ul key={i}>
              {lines.map((l, j) => (
                <li key={j}>{inline(l.slice(2), linker)}</li>
              ))}
            </ul>
          );
        }
        return <p key={i}>{inline(block.replace(/\n/g, " "), linker)}</p>;
      })}
      {openEntry && (
        <div className="term-def" id={defId} role="note" aria-label={`Definition: ${openEntry.term}`}>
          <p className="term-def__term">{openEntry.term}</p>
          <MarkdownLite text={openEntry.definition} />
          <p className="term-def__actions">
            {referenceHref && (
              <a href={`${referenceHref}#${termSlug(openEntry.term)}`} target="_blank" rel="noopener noreferrer">
                Open the full reference
              </a>
            )}
            <button type="button" className="term-def__close" onClick={() => setOpen(null)}>
              Close
            </button>
          </p>
        </div>
      )}
    </div>
  );
}

function inline(text: string, linker: Linker | null): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /\*\*(.+?)\*\*|\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(...withTerms(text.slice(last, m.index), linker, `t${key++}`));
    if (m[1] !== undefined) {
      parts.push(<strong key={key++}>{withTerms(m[1], linker, `b${key}`)}</strong>);
    } else if (m[2] !== undefined) {
      parts.push(
        <a key={key++} href={m[3]} target="_blank" rel="noopener noreferrer">
          {m[2]}
        </a>
      );
    }
    last = re.lastIndex;
  }
  if (last < text.length) parts.push(...withTerms(text.slice(last), linker, `t${key++}`));
  return parts;
}

/** Splits plain text around term mentions, turning each into a toggle for its definition. */
function withTerms(text: string, linker: Linker | null, keyPrefix: string): ReactNode[] {
  if (!linker) return [text];
  const parts: ReactNode[] = [];
  let last = 0;
  for (const hit of linker.find(text, linker.used)) {
    if (hit.start > last) parts.push(text.slice(last, hit.start));
    const isOpen = linker.open === hit.entry;
    parts.push(
      <button
        key={`${keyPrefix}-${hit.start}`}
        type="button"
        className="term"
        aria-expanded={isOpen}
        aria-controls={isOpen ? linker.defId : undefined}
        onClick={() => linker.toggle(hit.entry)}
      >
        {text.slice(hit.start, hit.end)}
      </button>
    );
    last = hit.end;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
