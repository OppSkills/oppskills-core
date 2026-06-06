import type { CommunityPostAuthorInfo } from "@oppskills/types";

export function formatAuthorName(author: CommunityPostAuthorInfo): string {
  const parts = [author.firstName, author.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Community Member";
}

export function getAuthorInitials(author: CommunityPostAuthorInfo): string {
  const name = formatAuthorName(author);
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function stripHtmlPreview(html: string, maxLength = 100): string {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}
