const COMBINING_MARKS = /[\u0300-\u036f]/g;

export function fold(text: string): string {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const base = ch.normalize('NFD').replace(COMBINING_MARKS, '').toLowerCase();
    if (base.length === 1) out += base;
    else out += ch.toLowerCase().length === 1 ? ch.toLowerCase() : ch;
  }
  return out;
}

export function matches(text: string, query: string): boolean {
  const q = fold(query.trim());
  return q === '' || fold(text).includes(q);
}

export interface Segment {
  text: string;
  match: boolean;
}

export function highlightSegments(text: string, query: string): Segment[] {
  const q = fold(query.trim());
  if (!q || !text) return [{ text, match: false }];

  const folded = fold(text);
  const out: Segment[] = [];
  let from = 0;
  for (;;) {
    const at = folded.indexOf(q, from);
    if (at === -1) break;
    if (at > from) out.push({ text: text.slice(from, at), match: false });
    out.push({ text: text.slice(at, at + q.length), match: true });
    from = at + q.length;
  }
  if (from < text.length) out.push({ text: text.slice(from), match: false });
  return out.length ? out : [{ text, match: false }];
}
