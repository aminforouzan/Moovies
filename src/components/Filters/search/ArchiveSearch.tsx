import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ArrowRight, SearchIcon, Star, XIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Portal } from "@/Portal";
import { HorizontalDivider } from "../../HorizontalDivider";
import { loadSiteData } from "@/lib/load-site-data";
import type { TitleRecord } from "@/lib/types";
import { formatVotes } from "@/lib/utils";
import { genreList } from "@/lib/genres";
import { HighlightTitle } from "@/components/Filters/search/HighlightTitle";

const SEARCH_PLACEHOLDER = "جست‌وجوی اسم فیلم یا سریال ...";
const ARCHIVE_PATH = "/archive";
const RECENT_KEY = "moovies:recent-searches";
const SUGGEST_LIMIT = 10;

interface ArchiveSearchProps {
  variant: "desktop" | "mobile";
}

export function ArchiveSearch({ variant }: ArchiveSearchProps) {
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") ?? "";

  if (variant === "desktop") {
    return <DesktopSearch urlQuery={urlQuery} key={urlQuery} />;
  }

  return <MobileSearch urlQuery={urlQuery} />;
}

function readRecent(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((x) => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

function writeRecent(list: string[]) {
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

interface SearchState {
  query: string;
  setQuery: (v: string) => void;
  titles: TitleRecord[] | null;
  recent: string[];
  suggestions: TitleRecord[];
  loading: boolean;
  commit: (value: string) => void;
  clearRecent: () => void;
}

function useSearchState(
  initialQuery: string,
  onClose: () => void,
): SearchState {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialQuery);
  const [debounced, setDebounced] = useState(initialQuery);
  const [titles, setTitles] = useState<TitleRecord[] | null>(null);
  const [recent, setRecent] = useState<string[]>(() => readRecent());

  useEffect(() => {
    loadSiteData().then((d) => setTitles(d.titles));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  const suggestions = useMemo<TitleRecord[]>(() => {
    if (!titles || debounced.trim().length === 0) return [];
    const q = debounced.trim().toLowerCase();
    const out: TitleRecord[] = [];
    for (const t of titles) {
      if (t.title.toLowerCase().includes(q)) {
        out.push(t);
        if (out.length >= SUGGEST_LIMIT) break;
      }
    }
    return out;
  }, [titles, debounced]);

  function commit(value: string) {
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    const nextRecent = [trimmed, ...recent.filter((r) => r !== trimmed)].slice(
      0,
      8,
    );
    writeRecent(nextRecent);
    setRecent(nextRecent);

    const params = new URLSearchParams();
    params.set("q", trimmed);
    navigate({ pathname: ARCHIVE_PATH, search: params.toString() });
    onClose();
  }

  function clearRecent() {
    writeRecent([]);
    setRecent([]);
  }

  const loading =
    titles === null || (query.trim().length > 0 && query !== debounced);

  return {
    query,
    setQuery,
    titles,
    recent,
    suggestions,
    loading,
    commit,
    clearRecent,
  };
}

function SearchBody({
  query,
  suggestions,
  recent,
  loading,
  commit,
  clearRecent,
  onClose,
}: {
  query: string;
  suggestions: TitleRecord[];
  recent: string[];
  loading: boolean;
  commit: (v: string) => void;
  clearRecent: () => void;
  onClose: () => void;
}) {
  const showRecent = query.trim().length === 0 && recent.length > 0;
  const showSuggestions = query.trim().length > 0;

  return (
    <div className="flex-1 overflow-auto px-3 py-2">
      {!showRecent && !showSuggestions && (
        <section className="px-2 pt-2 pb-3">
          <p className="text-sm text-muted-foreground">
            اسم فیلم یا سریال را برای جست‌وجو به انگلیسی بنویسید
          </p>
        </section>
      )}

      {showRecent && (
        <section className="py-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold">جستجوهای اخیر</h3>
            <button
              type="button"
              onClick={clearRecent}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              پاک کردن
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recent.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => commit(r)}
                className="rounded-full border px-3 py-1 text-sm text-foreground hover:bg-accent"
              >
                <span className="relative top-px text-muted-foreground">
                  {r}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}
      {showSuggestions && (
        <section className="py-2">
          {loading && (
            <div className="flex items-center justify-center py-8">
              <Spinner className="size-6 text-primary" />
            </div>
          )}
          {!loading && suggestions.length === 0 && (
            <p className="py-3 text-center text-sm text-muted-foreground">
              چیزی پیدا نشد
            </p>
          )}
          {!loading && suggestions.length > 0 && (
            <>
              <button
                type="button"
                onClick={() => commit(query)}
                className="flex w-full items-center gap-3 p-2 text-start hover:bg-muted"
              >
                <div className="flex size-12 items-center justify-center">
                  <SearchIcon className="size-5 shrink-0 text-muted-foreground" />
                </div>
                <span className="text-base font-medium">
                  {`جست‌وجوی ${query} در آرشیو`}
                </span>
              </button>
              <HorizontalDivider color="bg-border" />
              <ul className="flex flex-col">
                {suggestions.map((t, idx) => (
                  <li key={t.imdb_code}>
                    {idx > 0 && <HorizontalDivider color="bg-border" />}
                    <Link
                      to={`/titles/${t.imdb_code}`}
                      onClick={onClose}
                      className="flex w-full items-center gap-3 p-2 text-start hover:bg-muted"
                    >
                      <img
                        src={`/posters/${t.imdb_code}.jpg`}
                        alt={t.title}
                        className="size-12 shrink-0 rounded-md object-cover"
                        loading="lazy"
                      />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="text-base font-bold">
                          {HighlightTitle(t.title, query)}
                          {t.year ? ` (${t.year})` : ""}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Star className="relative bottom-0.5 size-3.5 fill-amber-400 text-amber-400" />
                            <span>{t.imdb_rate}</span>
                            <span>از</span>
                            <span>{formatVotes(t.imdb_votes)}</span>
                          </div>
                          <div className="relative bottom-px h-1 w-1 rounded-full bg-muted-foreground/50"></div>
                          <span>
                            {t.title_type === "movie" ? "فیلم" : "سریال"}
                          </span>
                          <div className="relative bottom-px h-1 w-1 rounded-full bg-muted-foreground/50"></div>
                          <span className="truncate">
                            {genreList(t.genres.slice(0, 2))}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- desktop -- */

function DesktopSearch({ urlQuery }: { urlQuery: string }) {
  const [open, setOpen] = useState(false);
  const search = useSearchState(urlQuery, () => setOpen(false));
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        role="search"
        className="relative flex w-full items-center"
        onSubmit={(e) => {
          e.preventDefault();
          search.commit(search.query);
        }}
      >
        <Input
          ref={inputRef}
          type="text"
          name="q"
          aria-label="جستجو در آرشیو"
          placeholder={SEARCH_PLACEHOLDER}
          value={search.query}
          onChange={(e) => search.setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          className="h-10 w-full rounded-full border-0 bg-input/50! px-9 transition-all"
        />
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute inset-s-3 size-4.5 text-muted-foreground"
        />
        {search.query.length > 0 && (
          <XIcon
            aria-hidden="true"
            className="absolute inset-e-3 size-4 cursor-pointer text-muted-foreground"
            onClick={() => {
              search.setQuery("");
              setOpen(false);
            }}
          />
        )}
      </form>
      {open && (
        <div className="absolute z-50 mt-2 max-h-128 w-full overflow-y-auto rounded-md border border-border bg-background shadow-lg">
          <SearchBody
            query={search.query}
            suggestions={search.suggestions}
            recent={search.recent}
            loading={search.loading}
            commit={search.commit}
            clearRecent={search.clearRecent}
            onClose={() => {
              setOpen(false);
              search.setQuery("");
            }}
          />
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------- mobile -- */

function MobileSearch({ urlQuery }: { urlQuery: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <span className="relative flex flex-1 items-center">
        <SearchIcon
          aria-hidden="true"
          className="pointer-events-none absolute inset-s-3 size-4.5 text-muted-foreground"
        />
        <Input
          type="text"
          readOnly
          aria-label="جستجوی فیلم یا سریال"
          placeholder={SEARCH_PLACEHOLDER}
          onClick={() => setOpen(true)}
          onFocus={() => setOpen(true)}
          className="h-10 w-full rounded-full border-0 bg-input/50 ps-9 pe-3 text-base text-muted-foreground"
        />
      </span>
      {open && (
        <MobileSearchModal
          onClose={() => setOpen(false)}
          initialQuery={urlQuery}
        />
      )}
    </>
  );
}

function MobileSearchModal({
  onClose,
  initialQuery,
}: {
  onClose: () => void;
  initialQuery: string;
}) {
  const search = useSearchState(initialQuery, onClose);

  useEffect(() => {
    document.body.classList.add("no-scroll");
    return () => document.body.classList.remove("no-scroll");
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    search.commit(search.query);
  }

  return (
    <Portal>
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        {/* top bar */}
        <div className="flex items-center gap-2 px-3 py-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن جستجو"
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-accent"
          >
            <ArrowRight className="size-5" />
          </button>
          <form
            role="search"
            className="relative flex flex-1 items-center"
            onSubmit={handleSubmit}
          >
            <Input
              ref={inputRef}
              type="text"
              name="q"
              aria-label="جستجوی فیلم یا سریال"
              placeholder={SEARCH_PLACEHOLDER}
              value={search.query}
              onChange={(e) => search.setQuery(e.target.value)}
              className="h-10 w-full rounded-full border-0 bg-muted px-9 text-base"
            />
            <SearchIcon
              aria-hidden="true"
              className="pointer-events-none absolute inset-s-3 size-4.5 text-muted-foreground"
            />
            {search.query.length > 0 && (
              <XIcon
                aria-hidden="true"
                className="absolute inset-e-3 size-4 cursor-pointer text-muted-foreground"
                onClick={() => {
                  search.setQuery("");
                }}
              />
            )}
          </form>
        </div>

        <SearchBody
          query={search.query}
          suggestions={search.suggestions}
          recent={search.recent}
          loading={search.loading}
          commit={search.commit}
          clearRecent={search.clearRecent}
          onClose={onClose}
        />
      </div>
    </Portal>
  );
}
