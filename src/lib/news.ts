import type { CollectionEntry } from "astro:content";

/**
 * Returns the canonical URL path for a news post in the format
 * /news/YYYY/MM/<slug> where MM is zero-padded to 2 digits.
 */
export function getNewsUrl(post: CollectionEntry<"news">): string {
  const date = new Date(post.data.pubDate);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `/news/${year}/${month}/${post.id}`;
}
