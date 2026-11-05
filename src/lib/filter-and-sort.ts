import type { DataTableState, TitleRecord } from "@/lib/types";

const COMPARATORS: Record<
  DataTableState["sort"]["type"],
  (a: TitleRecord, b: TitleRecord) => number
> = {
  "most-vote": (a, b) => b.imdb_votes - a.imdb_votes,
  "least-vote": (a, b) => a.imdb_votes - b.imdb_votes,
  "most-score": (a, b) => b.imdb_rate - a.imdb_rate,
  "least-score": (a, b) => a.imdb_rate - b.imdb_rate,
};

/**
 * Pure: filters then sorts.
 */
export function filterAndSortTitles(
  titles: TitleRecord[],
  state: DataTableState,
): TitleRecord[] {
  const filters = state.filters;
  if (filters.invalid) return [];
  const query = filters.search_query.trim().toLowerCase();
  const [lowVote, highVote] = [
    filters.imdb_votes_range.low,
    filters.imdb_votes_range.high,
  ];
  const [lowRate, highRate] = [
    filters.imdb_rate_range.low,
    filters.imdb_rate_range.high,
  ];
  const [lowYear, highYear] = [
    filters.year_range.low,
    filters.year_range.high,
  ];
  const [lowRuntime, highRuntime] = [
    filters.runtime_range.low,
    filters.runtime_range.high,
  ];

  const filtered = titles.filter((item) => {
    // search query
    if (query.length > 0 && !item.title.toLowerCase().includes(query)) {
      return false;
    }
    // item type
    if (
      filters.list_type.length > 0 &&
      !filters.list_type.includes(item.title_type)
    ) {
      return false;
    }
    // has dub
    if (
      filters.hasDubbed.length > 0 &&
      !filters.hasDubbed.includes(item.dubbed)
    ) {
      return false;
    }
    // has sub
    if (
      filters.hasSubtitle.length > 0 &&
      !filters.hasSubtitle.includes(item.subtitle)
    ) {
      return false;
    }
    // genres (pill)
    if (
      filters.genres.length > 0 &&
      !filters.genres.every((g) => item.genres.includes(g))
    ) {
      return false;
    }
    // num of vote check
    if (item.imdb_votes < lowVote || item.imdb_votes > highVote) return false;
    // num of rate check
    if (item.imdb_rate < lowRate || item.imdb_rate > highRate) return false;
    // year check    
    if (item.year != null) {
      const { start, end } = parseYear(item.year);
      if (start < lowYear || end > highYear) return false;
    }
    // runtime check
    if (item.runtime != null) {
      if (item.runtime < lowRuntime || item.runtime > highRuntime) return false;
    }

    return true;
  });

  return filtered.sort(COMPARATORS[state.sort.type]);
}

function parseYear(value: string): { start: number; end: number } {
  const trimmed = value.trim();
  if (trimmed.includes("-")) {
    const [startRaw, endRaw] = trimmed.split("-");
    const start = Number(startRaw);
    const end = endRaw ? Number(endRaw) : Infinity;
    return { start: Number.isFinite(start) ? start : 0, end: Number.isFinite(end) ? end : Infinity };
  }
  const n = Number(trimmed);
  return { start: n, end: n };
}
