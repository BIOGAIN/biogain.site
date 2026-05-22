/**
 * Rehype plugin: prefixes a configured base path onto absolute internal
 * `src` and `href` attributes in markdown-rendered HTML.
 *
 * Astro auto-bases imports from `src/assets/`, but markdown references to
 * files in `public/` (e.g. `![](/foo.jpg)`) are emitted verbatim, which
 * 404s when the site is served under a sub-path. This plugin rewrites
 * those references at build time.
 *
 * Leaves alone: protocol-relative URLs, external URLs, mailto:, tel:,
 * fragments, paths already prefixed with the base, and any path that
 * doesn't start with a single `/`.
 *
 * Usage in astro.config.mjs:
 *   rehypePlugins: [[rehypeBasePaths, { base: '/biogain.site' }]]
 */
export default function rehypeBasePaths(options = {}) {
  const rawBase = options.base || '';
  const base = rawBase.replace(/\/$/, '');

  return (tree) => {
    if (!base) return;

    const rewrite = (node) => {
      if (node.type === 'element' && node.properties) {
        for (const attr of ['src', 'href']) {
          const value = node.properties[attr];
          if (typeof value !== 'string') continue;
          if (!value.startsWith('/')) continue;
          if (value.startsWith('//')) continue;
          if (value === base || value.startsWith(base + '/')) continue;
          node.properties[attr] = base + value;
        }
      }
      if (node.children) {
        for (const child of node.children) rewrite(child);
      }
    };

    rewrite(tree);
  };
}
