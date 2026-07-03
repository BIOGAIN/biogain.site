/**
 * Single source of truth for consortium-partner and funder logos.
 *
 * Logo files live under `src/assets/logos/{partners,funders}/` and are imported
 * here as build-hashed URLs (`query: '?url'`) so a single <img>-based render
 * path handles both vector (SVG) and raster (webp/png) files uniformly.
 *
 * Naming convention the resolver relies on — drop new files in matching this and
 * they light up automatically, no code change needed:
 *   partners/<key>-compact.<ext>   → square-ish logo for tight spots (team page)
 *   partners/<key>-wide.<ext>      → horizontal logo for roomy spots (footer)
 *   funders/<key>.<ext>            → funding-organisation logo
 *
 * A missing `-wide` file transparently falls back to `-compact`, so you can add
 * the horizontal versions later without touching any component. A partner or
 * funder whose file hasn't been added yet resolves to `undefined` and is simply
 * skipped when rendered.
 */

// Eagerly resolve every logo to its final (hashed) URL. `?url` bypasses Astro's
// SVG-as-component transform so SVGs come back as plain URL strings like rasters.
const logoUrls = import.meta.glob<string>(
  '../assets/logos/**/*.{svg,webp,png,jpg,jpeg,avif}',
  { eager: true, query: '?url', import: 'default' },
);

/** Look up a logo URL by its path relative to `logos/`, without extension. */
function resolve(relNoExt: string): string | undefined {
  const hit = Object.entries(logoUrls).find(
    ([path]) =>
      path.replace(/^.*\/logos\//, '').replace(/\.[^.]+$/, '') === relNoExt,
  );
  return hit?.[1];
}

export interface PartnerLogo {
  key: string;
  /** Accessible label and link title. */
  name: string;
  /** External homepage. */
  url: string;
  /** In-page anchor on /team (raw path — apply withBase() at render time). */
  teamAnchor: string;
  /** Resolved compact-logo URL (undefined until the file is added). */
  compact?: string;
  /** Resolved wide-logo URL; falls back to the compact file when absent. */
  wide?: string;
  /** Per-logo height tuning for the compact row (logos differ in visual weight). */
  compactClass: string;
  /** Optional per-logo tuning for the wide row. */
  wideClass?: string;
}

// Order here is the order logos render in.
const partnerDefs: Omit<PartnerLogo, 'compact' | 'wide'>[] = [
  {
    key: 'boku',
    name: 'BOKU University Vienna',
    url: 'https://boku.ac.at',
    teamAnchor: '/team#affiliation-boku',
    compactClass: 'max-h-[2.5rem] sm:h-[5rem]',
    wideClass: 'h-[3.74rem] sm:h-[4.99rem] md:h-[6.24rem]',
  },
  {
    key: 'tuberlin',
    name: 'TU Berlin',
    url: 'https://www.tu.berlin',
    teamAnchor: '/team#affiliation-tu-berlin',
    compactClass: 'max-h-[3rem] sm:h-[6rem]',
  },
  {
    key: 'wroclaw',
    name: 'Wrocław University of Environmental and Life Sciences',
    url: 'https://upwr.edu.pl',
    teamAnchor: '/team#affiliation-upwr',
    compactClass: 'max-h-[3.375rem] sm:h-[6.75rem]',
    wideClass: 'h-[2.73rem] sm:h-[3.64rem] md:h-[4.55rem]',
  },
  {
    key: 'aalborg',
    name: 'Aalborg University',
    url: 'https://www.aau.dk',
    teamAnchor: '/team#affiliation-aau',
    compactClass: 'max-h-[3.375rem] sm:h-[6.75rem]',
  },
  {
    key: 'utrecht',
    name: 'Utrecht University',
    url: 'https://www.uu.nl',
    teamAnchor: '/team#affiliation-uu',
    compactClass: 'max-h-[3.5rem] sm:h-[7rem] translate-y-1.5 sm:translate-y-3',
  },
];

export const partnerLogos: PartnerLogo[] = partnerDefs.map((p) => ({
  ...p,
  compact: resolve(`partners/${p.key}-compact`),
  wide: resolve(`partners/${p.key}-wide`) ?? resolve(`partners/${p.key}-compact`),
}));

export interface FunderLogo {
  key: string;
  /** Accessible label and link title. */
  name: string;
  /** External homepage / project page. */
  url: string;
  /** Short abbreviation (matches the acknowledgement text in the footer). */
  abbr: string;
  /**
   * Optional per-logo height tuning for the funder row. All funders start at the
   * average partner wide height; set this to nudge an individual one (e.g.
   * `'md:h-[6rem]'`). Overrides the shared height via twMerge.
   */
  logoClass?: string;
  /** Resolved logo URL (undefined until the file is added under funders/). */
  logo?: string;
}

// The funders behind BIOGAIN via the Biodiversa+ 2024–2025 BiodivTransform call.
// Drop the national funders' logos into
// src/assets/logos/funders/<key>.svg (e.g. funders/fwf.svg) to have them appear.
const funderDefs: Omit<FunderLogo, 'logo'>[] = [
  { key: 'biodiversa-plus', name: 'Biodiversa+', url: 'https://www.biodiversa.eu/2026/04/03/biogain/', abbr: 'Biodiversa+', logoClass: 'h-[2.48rem] sm:h-[3.3rem] md:h-[4.13rem]' },
  { key: 'eu', name: 'European Commission', url: 'https://cordis.europa.eu/project/id/101052342', abbr: 'EU', logoClass: 'h-[2.48rem] sm:h-[3.3rem] md:h-[4.13rem]' },
  { key: 'fwf', name: 'Austrian Science Fund', url: 'https://www.fwf.ac.at', abbr: 'FWF', logoClass: 'h-[1.95rem] sm:h-[2.6rem] md:h-[3.25rem]' },
  { key: 'nwo', name: 'Dutch Research Council', url: 'https://www.nwo.nl', abbr: 'NWO', logoClass: 'h-[3.82rem] sm:h-[5.09rem] md:h-[6.37rem]' },
  { key: 'bmftr', name: 'Federal Ministry of Research, Technology and Space', url: 'https://www.bmftr.bund.de', abbr: 'BMFTR', logoClass: 'h-[3.91rem] sm:h-[5.22rem] md:h-[6.52rem]' },
  { key: 'fona', name: 'Research for Sustainability (FONA)', url: 'https://www.fona.de/', abbr: 'FONA' },
  { key: 'ncn', name: 'National Science Centre Poland', url: 'https://www.ncn.gov.pl', abbr: 'NCN', logoClass: 'h-[1.85rem] sm:h-[2.48rem] md:h-[3.1rem]' },
  { key: 'ifd', name: 'Innovation Fund Denmark', url: 'https://innovationsfonden.dk', abbr: 'IFD', logoClass: 'h-[1.545rem] sm:h-[2.065rem] md:h-[2.58rem]' },
];

export const funderLogos: FunderLogo[] = funderDefs.map((f) => ({
  ...f,
  logo: resolve(`funders/${f.key}`),
}));
