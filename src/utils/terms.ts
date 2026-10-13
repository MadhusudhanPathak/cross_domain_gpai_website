/** A defined term. `matches` lists the phrases that link to it in item text (case-insensitive; a trailing "s" also matches). */
export type TermEntry = { term: string; definition: string; matches?: string[] };

export type TermHit = { start: number; end: number; entry: number };

/** Anchor id for a term on the reference page. */
export const termSlug = (term: string): string =>
  term
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Returns a finder for the entries' `matches` phrases. Each call reports, left to right, the first mention of each
 * entry not yet in `used` (and adds it there), so a term is linked once per text. At a given position the longest
 * phrase wins, so "classifiers trained from a constitution" beats "constitution".
 */
export function termFinder(entries: TermEntry[]): (text: string, used: Set<number>) => TermHit[] {
  const owner = new Map<string, number>();
  entries.forEach((e, i) => e.matches?.forEach((m) => owner.has(m.toLowerCase()) || owner.set(m.toLowerCase(), i)));
  const phrases = [...owner.keys()].sort((a, b) => b.length - a.length);
  if (!phrases.length) return () => [];
  const pattern = `(?<![\\w-])(?:${phrases.map(escape).join("|")})s?(?![\\w])`;

  return (text, used) => {
    const hits: TermHit[] = [];
    for (const m of text.matchAll(new RegExp(pattern, "gi"))) {
      const found = m[0].toLowerCase();
      const entry = owner.get(found) ?? owner.get(found.slice(0, -1));
      if (entry === undefined || used.has(entry) || m.index === undefined) continue;
      used.add(entry);
      hits.push({ start: m.index, end: m.index + m[0].length, entry });
    }
    return hits;
  };
}
