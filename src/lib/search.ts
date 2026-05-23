/**
 * Shared Pagefind client module.
 *
 * Loads the Pagefind JS bundle lazily at runtime so Vite never tries to
 * resolve `/pagefind/pagefind.js` at build time.
 *
 * In development the bundle won't exist, so we degrade gracefully.
 */

export interface PagefindResult {
  id: string;
  url: string;
  meta: {
    title?: string;
    [key: string]: string | undefined;
  };
  excerpt: string;
}

export interface PagefindSearchResult {
  results: PagefindResult[];
  error?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pagefind: any = null;
let loadError: string | null = null;

async function loadPagefind(): Promise<boolean> {
  if (pagefind) return true;
  if (loadError) return false;

  try {
    // Use a variable so Rollup/Vite does not attempt to statically resolve
    // this path at build time. The file is produced by `pagefind --site dist`
    // after the Astro build completes and is served as a static asset.
    // Respect the site base path (e.g. /biogain.site) so the correct URL is
    // fetched when the site is hosted under a sub-path.
    const base = (import.meta.env.BASE_URL ?? "/").replace(/\/$/, "");
    const pagefindPath = `${base}/pagefind/pagefind.js`;
    pagefind = await import(/* @vite-ignore */ pagefindPath);
    await pagefind.init();
    return true;
  } catch {
    loadError =
      "Search index not available. Run `npm run build && npm run preview` to enable search.";
    return false;
  }
}

export async function search(query: string): Promise<PagefindSearchResult> {
  if (!query.trim()) return { results: [] };

  const loaded = await loadPagefind();
  if (!loaded) {
    return { results: [], error: loadError ?? "Failed to load search index." };
  }

  try {
    const response = await pagefind.search(query);
    const results: PagefindResult[] = await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response.results.slice(0, 20).map(async (r: any) => {
        const data = await r.data();
        return {
          id: r.id,
          url: data.url as string,
          meta: (data.meta ?? {}) as PagefindResult["meta"],
          excerpt: (data.excerpt as string) ?? "",
        };
      })
    );
    return { results };
  } catch (err) {
    return {
      results: [],
      error: err instanceof Error ? err.message : "Search failed.",
    };
  }
}
