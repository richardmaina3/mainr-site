/*
  Inline links for text in the content files: write [visible text](https://address) anywhere in a
  string. Nothing else is treated as markup. Only https links are accepted, and the build fails on
  anything that looks like a link but is not a valid one (see `validInlineLinks`).
*/

export type TextPiece = string | { text: string; href: string };

const LINK = /\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g;

/** Splits a string into plain text and links, in order. */
export function parseInlineLinks(value: string): TextPiece[] {
  const pieces: TextPiece[] = [];
  let last = 0;
  for (const match of value.matchAll(LINK)) {
    if (match.index > last) pieces.push(value.slice(last, match.index));
    pieces.push({ text: match[1], href: match[2] });
    last = match.index + match[0].length;
  }
  if (last < value.length) pieces.push(value.slice(last));
  return pieces;
}

/** False when the text has a link-like `](` that is not a valid [text](https://…) link, for example a typo or an http address. */
export function validInlineLinks(value: string): boolean {
  return !value.replace(LINK, '').includes('](');
}
