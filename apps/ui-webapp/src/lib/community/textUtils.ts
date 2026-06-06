/** Plain-text length for rich HTML content (tags stripped). */
export function getPlainTextLengthFromHtml(html: string): number {
  if (!html) return 0;
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/\u00a0/g, " ")
    .trim().length;
}

export function truncatePlainTextInHtml(html: string, maxLength: number): string {
  const plain = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ");
  if (plain.trim().length <= maxLength) return html;
  return plain.slice(0, maxLength);
}
