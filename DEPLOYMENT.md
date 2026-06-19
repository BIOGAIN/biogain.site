# Deployment

The site is deployed to **GitHub Pages** and served from the production
domain **`https://biogain-project.eu`** (with `www.biogain-project.eu`
redirecting to the apex).

It was previously hosted at `https://biogain.github.io/biogain.site/`
as a preview behind a `/biogain.site` base path. The base-path machinery
described below is now a no-op (`base` is empty) but kept in place so the
site stays portable if we ever need to preview at a sub-path again. The
**Launch checklist** records the steps that were taken to flip to the
production domain.

## How the deploy works

- Push to `main` triggers `.github/workflows/deploy.yml`.
- The workflow runs `npm ci && npm run build` on Node 22, then publishes
  the `dist/` artifact via `actions/deploy-pages@v4`.
- Pages source in repo settings must be set to **GitHub Actions**
  (Settings → Pages → Build and deployment → Source).

## Base-path handling (preview only)

While we're on `biogain.github.io/biogain.site/`, every URL has to be
prefixed with `/biogain.site/`. This is handled in two places:

1. `astro.config.mjs` sets `base: '/biogain.site'` and
   `site: 'https://biogain.github.io'`. Astro then exposes
   `import.meta.env.BASE_URL` (which is `/biogain.site/`).
2. The `withBase()` helper in `src/lib/utils.ts` prepends that base to
   any internal href or asset path. It's a no-op for `http(s)://`,
   `mailto:`, and fragment links.

**Rule of thumb when adding new code:** any `href` or `src` that points
to an internal route or to a file in `public/` must go through
`withBase()`. Imports from `src/assets/` (used by Astro's `<Image>`
component or by SVG imports) handle the base automatically — don't wrap
those.

### Markdown content

Markdown `![]()` references to files in `public/` are rewritten at
build time by the `rehype-base-paths` plugin (see
`src/lib/rehype-base-paths.mjs`, wired up in `astro.config.mjs`).
Authors write `/foo.jpg` in markdown and the plugin emits
`/biogain.site/foo.jpg` in the rendered HTML. Nothing in `src/content/`
needs to know about the base.

## Launch checklist — switching to biogain-project.eu

Steps taken to flip from the GitHub Pages preview to the production
domain (all in one PR):

- [x] **`astro.config.mjs`** — `SITE_BASE` set to `''` and `site` set to
      `'https://biogain-project.eu'`. The `rehype-base-paths` plugin
      becomes a no-op once `base` is empty, so it stays wired up.
- [x] **`public/robots.txt`** — replaced the `Disallow: /` block with
      `Allow: /` and added the sitemap line:
      `Sitemap: https://biogain-project.eu/sitemap-index.xml`.
- [x] **`public/CNAME`** — file containing one line:
      `biogain-project.eu`. (Keeps GitHub Pages from wiping the
      custom-domain setting on every deploy.)
- [ ] **GitHub repo settings** — at
      `https://github.com/BIOGAIN/biogain.site/settings/pages`, enter
      `biogain-project.eu` as the custom domain, wait for DNS check, then
      enable **Enforce HTTPS**. (Already attached per the launch request —
      verify HTTPS is enforced once DNS validates.)
- [ ] **DNS at the registrar** — apex `A` records for `biogain-project.eu`
      pointing to: `185.199.108.153`, `185.199.109.153`,
      `185.199.110.153`, `185.199.111.153` (and the `AAAA` equivalents
      `2606:50c0:8000::153` … `:8003::153` if IPv6 is desired). Add
      `CNAME www → BIOGAIN.github.io` so `www.biogain-project.eu` resolves
      and GitHub redirects it to the apex.
- [ ] **Smoke test after deploy** — load `https://biogain-project.eu/`
      and `https://www.biogain-project.eu/` (should redirect to apex),
      navigate through Home → About → News → an article → Tags. Check
      favicon, fonts, hero image, and consortium logos all load (no
      404s in the browser console).

The `withBase()` helper itself does **not** need to be removed — with
`BASE_URL` back at `/`, it becomes a no-op and keeps the site portable
in case we ever need to preview at a sub-path again.

## Files involved in the base-path setup

If something looks off, these are the files that know about the base:

- `astro.config.mjs` — sets `base` and `site`.
- `src/lib/utils.ts` — `withBase()` helper.
- `src/components/Header.astro` — strips base from `Astro.url.pathname`
  so the active-nav comparisons still work.
- `src/components/SEO.astro` — base-prefixes the default OG image and
  the `<link rel="sitemap">` / RSS hrefs.
- `src/components/FontPreload.astro`, `src/components/Logo.astro`,
  `src/components/Footer.astro`, all four layouts in `src/layouts/`,
  the section components in `src/components/sections/`, and the pages
  under `src/pages/` use `withBase()` on every internal href/src.
