/**
 * SearchResults
 *
 * Client island for the /search page.
 * Reads ?q= from URL on mount, prefills the input, and shows live results.
 * Degrades gracefully: the wrapping <form> in search.astro handles no-JS submit.
 */

import * as React from "react";
import { Input } from "@/components/ui/input";
import { search, type PagefindResult } from "@/lib/search";

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = React.useState<T>(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

interface SearchResultsProps {
  /** Initial query from the URL ?q= param, passed in from Astro */
  initialQuery?: string;
}

export function SearchResults({ initialQuery = "" }: SearchResultsProps) {
  const [query, setQuery] = React.useState(initialQuery);
  const [results, setResults] = React.useState<PagefindResult[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [searched, setSearched] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 200);

  // Run search whenever debounced query changes
  React.useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setError(null);
      setLoading(false);
      setSearched(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    search(debouncedQuery).then(({ results: r, error: e }) => {
      if (cancelled) return;
      setResults(r);
      setError(e ?? null);
      setLoading(false);
      setSearched(true);
    });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // Update browser URL without navigation so shareable links stay current
  React.useEffect(() => {
    const url = new URL(window.location.href);
    if (debouncedQuery.trim()) {
      url.searchParams.set("q", debouncedQuery.trim());
    } else {
      url.searchParams.delete("q");
    }
    window.history.replaceState(null, "", url.toString());
  }, [debouncedQuery]);

  const hasResults = results.length > 0;

  return (
    <div className="space-y-8">
      {/* Input — JS-enhanced live search */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <Input
          ref={inputRef}
          name="q"
          type="search"
          placeholder="Search the site..."
          value={query}
          autoFocus
          onChange={(e) => setQuery(e.target.value)}
          className="pl-10 text-base h-12"
          aria-label="Search query"
        />
        {loading && (
          <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted-foreground animate-spin"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          </div>
        )}
      </div>

      {/* Results area */}
      <div aria-live="polite" aria-atomic="false">
        {error && (
          <div className="rounded-lg border bg-muted/50 px-4 py-6 text-sm text-muted-foreground text-center">
            {error}
          </div>
        )}

        {!error && searched && !hasResults && (
          <p className="text-muted-foreground text-center py-8">
            No results for &ldquo;{debouncedQuery}&rdquo;
          </p>
        )}

        {!error && hasResults && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              {results.length} result{results.length !== 1 ? "s" : ""} for{" "}
              &ldquo;{debouncedQuery}&rdquo;
            </p>
            <ul className="space-y-4" role="list">
              {results.map((result) => (
                <li key={result.id}>
                  <a
                    href={result.url}
                    className="block rounded-lg border bg-card p-4 hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <h2 className="text-base font-semibold text-foreground mb-1">
                      {result.meta.title ?? result.url}
                    </h2>
                    {result.excerpt && (
                      <p
                        className="text-sm text-muted-foreground [&_mark]:bg-[oklch(92%_0.05_150)] [&_mark]:text-[oklch(25%_0.02_150)] [&_mark]:font-semibold [&_mark]:px-0.5 [&_mark]:rounded"
                        dangerouslySetInnerHTML={{ __html: result.excerpt }}
                      />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}
