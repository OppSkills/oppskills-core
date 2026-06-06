/** Plain-text length for rich HTML (matches ui-webapp textUtils). */
export function getPlainTextLengthFromHtml(html: string): number {
  if (!html) return 0;
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim().length;
}
