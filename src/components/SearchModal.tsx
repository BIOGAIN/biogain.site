/**
 * SearchModal
 *
 * Command-palette style search modal using Radix Dialog.
 * Opens on Cmd/Ctrl+K or when the header search button is clicked.
 * Keyboard navigation: arrow keys move through results, Enter follows the link.
 */

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface SearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchModal({ open, onOpenChange }: SearchModalProps) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<PagefindResult[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const resultRefs = React.useRef<(HTMLAnchorElement | null)[]>([]);

  const debouncedQuery = useDebounce(query, 200);

  // Reset state when modal closes
  React.useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      setError(null);
      setActiveIndex(-1);
    }
  }, [open]);

  // Run search when debounced query changes
  React.useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    search(debouncedQuery).then(({ results: r, error: e }) => {
      if (cancelled) return;
      setResults(r);
      setError(e ?? null);
      setActiveIndex(-1);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  // Keyboard navigation
  function handleKeyDown(e: React.KeyboardEvent) {
    if (results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => {
        const next = i < results.length - 1 ? i + 1 : 0;
        resultRefs.current[next]?.focus();
        return next;
      });
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => {
        const prev = i > 0 ? i - 1 : results.length - 1;
        resultRefs.current[prev]?.focus();
        return prev;
      });
    }
  }

  const hasResults = results.length > 0;
  const showResults = hasResults && debouncedQuery.trim();
  const showEmpty =
    !loading && !error && debouncedQuery.trim() && !hasResults;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 p-0 overflow-hidden max-w-xl top-[30%] translate-y-0 sm:top-[30%] [&>button.absolute]:!top-6"
        onKeyDown={handleKeyDown}
      >
        {/* Visually hidden title for screen readers */}
        <DialogTitle className="sr-only">Site search</DialogTitle>

        {/* Search input */}
        <div className="flex items-center border-b px-4 py-3 gap-3">
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
            className="text-muted-foreground shrink-0"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <Input
            ref={inputRef}
            autoFocus
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0 h-auto text-base placeholder:text-muted-foreground"
            aria-label="Search query"
            aria-autocomplete="list"
            aria-controls={showResults ? "search-results" : undefined}
            aria-activedescendant={
              activeIndex >= 0 ? `result-${activeIndex}` : undefined
            }
          />
          {loading && (
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
              className="text-muted-foreground shrink-0 animate-spin"
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
          )}
        </div>

        {/* Results / status area */}
        {(showResults || showEmpty || error) && (
          <div
            role="listbox"
            id="search-results"
            aria-label={
              showResults ? `${results.length} search results` : undefined
            }
            className="overflow-y-auto max-h-80"
          >
            {error && (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                {error}
              </p>
            )}

            {showEmpty && (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">
                No results for &ldquo;{debouncedQuery}&rdquo;
              </p>
            )}

            {showResults && (
              <>
                <p className="sr-only" aria-live="polite" aria-atomic="true">
                  {results.length} result{results.length !== 1 ? "s" : ""} for{" "}
                  {debouncedQuery}
                </p>
                <ul className="py-2">
                  {results.map((result, i) => (
                    <li key={result.id} role="option" aria-selected={i === activeIndex}>
                      <a
                        id={`result-${i}`}
                        ref={(el) => { resultRefs.current[i] = el; }}
                        href={result.url}
                        onClick={() => onOpenChange(false)}
                        className="flex flex-col gap-1 px-4 py-3 hover:bg-accent focus:bg-accent focus:outline-none transition-colors"
                        tabIndex={0}
                      >
                        <span className="text-sm font-medium text-foreground line-clamp-1">
                          {result.meta.title ?? result.url}
                        </span>
                        {result.excerpt && (
                          <span
                            className="text-xs text-muted-foreground line-clamp-2 [&_mark]:bg-[oklch(92%_0.05_150)] [&_mark]:text-[oklch(25%_0.02_150)] [&_mark]:font-semibold [&_mark]:px-0.5 [&_mark]:rounded"
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
        )}

        {/* Footer hint */}
        <div className="border-t px-4 py-2 flex items-center gap-4 text-xs text-muted-foreground">
          <span>
            <kbd className="font-sans">Esc</kbd> to close
          </span>
          <span>
            <kbd className="font-sans">↑↓</kbd> navigate
          </span>
          <span>
            <kbd className="font-sans">↵</kbd> open
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * SearchTrigger
 *
 * Self-contained island: manages open state and registers the Cmd/Ctrl+K
 * global keyboard shortcut. Renders the search icon button + modal.
 */
export function SearchTrigger() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open site search (Cmd+K)"
        className="inline-flex items-center justify-center rounded-md p-2 text-foreground/60 hover:text-foreground hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </button>
      <SearchModal open={open} onOpenChange={setOpen} />
    </>
  );
}
