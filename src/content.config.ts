import { defineCollection, reference } from 'astro:content';
import { z } from 'astro/zod';
import { glob, file } from 'astro/loaders';

const linkTypes = [
  'orcid',
  'scholar',
  'bluesky',
  'homepage',
  'email',
  'linkedin',
  'github',
  'twitter',
] as const;

type LinkType = (typeof linkTypes)[number];

/**
 * Parse a workPackages entry string. Three shapes are recognised:
 *   "WP6 lead"  / "WP3 co-lead"  → { wp: "WP6", role: "lead" }            (composite role)
 *   "WP2"                        → { wp: "WP2" }                          (plain membership)
 *   "Project coordinator", …     → { wp: "Project coordinator", role: "standalone" }
 *                                  (standalone role — display label verbatim)
 */
function parseWorkPackageString(raw: string): { wp: string; role?: string } {
  const trimmed = raw.trim();
  const leadMatch = trimmed.match(/^(WP\d+)\s+(co-lead|lead)$/i);
  if (leadMatch) {
    return { wp: leadMatch[1], role: leadMatch[2].toLowerCase() };
  }
  if (/^WP\d+$/i.test(trimmed)) {
    return { wp: trimmed };
  }
  return { wp: trimmed, role: 'standalone' };
}

/** Infer link type and normalise URL from a bare string like `github.com/foo`. */
function parseLinkString(raw: string): { type: LinkType; url: string } {
  const trimmed = raw.trim();

  if (trimmed.startsWith('mailto:') || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    const url = trimmed.startsWith('mailto:') ? trimmed : `mailto:${trimmed}`;
    return { type: 'email', url };
  }

  const url = /^https?:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
  const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');

  if (host === 'orcid.org') return { type: 'orcid', url };
  if (host.endsWith('scholar.google.com')) return { type: 'scholar', url };
  if (host === 'bsky.app' || host.endsWith('.bsky.social')) return { type: 'bluesky', url };
  if (host === 'linkedin.com' || host.endsWith('.linkedin.com')) return { type: 'linkedin', url };
  if (host === 'github.com') return { type: 'github', url };
  if (host === 'twitter.com' || host === 'x.com') return { type: 'twitter', url };
  return { type: 'homepage', url };
}

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: ({ image }) => z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    author: z.string().default('BIOGAIN Team'),
    image: image().optional(),
    imageCaption: z.string().optional(),
    tags: z.array(z.string()).default([]),
    team: z.array(reference('team')).default([]),
  }),
});

const team = defineCollection({
  loader: file('src/data/team.yaml'),
  schema: z.object({
    name: z.string(),
    affiliation: z.string(),
    affiliationShort: z.string().optional(),
    country: z.string().optional(),
    links: z
      .array(
        z.union([
          z.string().transform(parseLinkString),
          z.object({
            type: z.enum(linkTypes),
            url: z.string(),
          }),
        ])
      )
      .default([]),
    workPackages: z
      .array(
        z.union([
          z.string().transform(parseWorkPackageString),
          z.object({
            wp: z.string(),
            role: z.string().optional(),
          }),
        ])
      )
      .default([]),
    order: z.number().optional(),
    summary: z.string().default(''),
  }),
});

export const collections = { news, team };
