import type { CollectionEntry } from 'astro:content';

/**
 * Returns the clean slug for a news post, stripping a trailing "/index"
 * that Astro appends when the entry file is named index.md inside a folder.
 * e.g. "unicorn-startup-founder/index" → "unicorn-startup-founder"
 */
export function getNewsSlug(post: CollectionEntry<'news'>): string {
  return post.id.replace(/\/index$/, '');
}

/**
 * Returns the canonical URL path for a news post in the format
 * /news/YYYY/MM/<slug> where MM is zero-padded to 2 digits.
 */
export function getNewsUrl(post: CollectionEntry<'news'>): string {
  const date = new Date(post.data.pubDate);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `/news/${year}/${month}/${getNewsSlug(post)}`;
}

/**
 * Returns a plain-text blurb for use in news listing cards.
 * Uses the post's `description` field directly (it is required in the schema),
 * trimmed to at most `maxLen` characters with an ellipsis when truncated.
 */
export function getBlurb(post: CollectionEntry<'news'>, maxLen = 180): string {
  const text = post.data.description.trim();
  if (text.length <= maxLen) return text;
  const truncated = text.slice(0, maxLen).replace(/\s+\S*$/, '');
  return `${truncated}…`;
}
