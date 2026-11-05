import type {
  DataTableAction,
  DataTableState,
  FiltersObj,
  SiteMeta,
  SortTypes,
} from "@/lib/types";
import { DEFAULT_SORT, SORTING_UI } from "@/lib/utils";

export const PAGE_SIZE = 12;

const LIST_TYPES = ["movie", "series"] as const;

export function rangeBounds(
  key: "imdb_votes_range" | "imdb_rate_range" | "year_range" | "runtime_range",
  meta: SiteMeta,
): { low: number; high: number } {
  return key === "imdb_votes_range"
    ? { low: meta.min_vote_count, high: meta.max_vote_count }
    : key === "year_range"
      ? { low: meta.min_year, high: meta.max_year }
      : key === "runtime_range"
        ? { low: meta.min_runtime, high: meta.max_runtime }
        : { low: 0, high: 10 };
}

export function createDefaultFilters(meta: SiteMeta): FiltersObj {
  return {
    search_query: "",
    invalid: false,
    imdb_votes_range: rangeBounds("imdb_votes_range", meta),
    imdb_rate_range: rangeBounds("imdb_rate_range", meta),
    year_range: rangeBounds("year_range", meta),
    runtime_range: rangeBounds("runtime_range", meta),
    list_type: [],
    hasSubtitle: [],
    hasDubbed: [],
    genres: [],
  };
}

export function createDefaultState(meta: SiteMeta): DataTableState {
  return {
    filters: createDefaultFilters(meta),
    sort: DEFAULT_SORT,
    pageination: { page: 1, pageSize: PAGE_SIZE },
  };
}

export function parseState(
  params: URLSearchParams,
  meta: SiteMeta,
): DataTableState {
  let filters = createDefaultFilters(meta);

  let valid = true;
  const q = params.get("q");
  filters.search_query = (q ?? "").trim();

  const typeRaw = params.get("type");
  if (typeRaw) {
    const tokens = typeRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const typeValid = tokens.every((t) => LIST_TYPES.includes(t as any));
    if (!typeValid) valid = false;
    else filters.list_type = parseList(typeRaw, LIST_TYPES);
  }

  const genreRaw = params.get("genres");
  if (genreRaw) {
    const tokens = genreRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    filters.genres = tokens;
  }

  const dubRaw = params.get("dub");
  if (dubRaw) {
    const tokens = dubRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.some((t) => t !== "0" && t !== "1")) valid = false;
    else filters.hasDubbed = parseBooleans(dubRaw);
  }

  const subRaw = params.get("sub");
  if (subRaw) {
    const tokens = subRaw
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (tokens.some((t) => t !== "0" && t !== "1")) valid = false;
    else filters.hasSubtitle = parseBooleans(subRaw);
  }

  const votes = parseRange(params.get("votes"));
  if (params.get("votes")) {
    if (!votes) valid = false;
    else {
      const bounds = rangeBounds("imdb_votes_range", meta);
      if (
        votes.low < bounds.low ||
        votes.high > bounds.high ||
        votes.low > votes.high
      )
        valid = false;
      else filters.imdb_votes_range = votes;
    }
  }
  const rate = parseRange(params.get("rate"));
  if (params.get("rate")) {
    if (!rate) valid = false;
    else {
      const bounds = rangeBounds("imdb_rate_range", meta);
      if (
        rate.low < bounds.low ||
        rate.high > bounds.high ||
        rate.low > rate.high
      )
        valid = false;
      else filters.imdb_rate_range = rate;
    }
  }

  const year = parseRange(params.get("year"));
  if (params.get("year")) {
    if (!year) valid = false;
    else {
      const bounds = rangeBounds("year_range", meta);
      if (
        year.low < bounds.low ||
        year.high > bounds.high ||
        year.low > year.high
      )
        valid = false;
      else filters.year_range = year;
    }
  }

  const runtime = parseRange(params.get("runtime"));
  if (params.get("runtime")) {
    if (!runtime) valid = false;
    else {
      const bounds = rangeBounds("runtime_range", meta);
      if (
        runtime.low < bounds.low ||
        runtime.high > bounds.high ||
        runtime.low > runtime.high
      )
        valid = false;
      else filters.runtime_range = runtime;
    }
  }

  if (!valid) {
    filters = createDefaultFilters(meta);
    filters.invalid = true;
  }

  return {
    filters,
    sort: parseSort(params.get("sort")),
    pageination: { page: parsePage(params.get("page")), pageSize: PAGE_SIZE },
  };
}

export function stateToSearchParams(
  state: DataTableState,
  meta: SiteMeta,
): URLSearchParams {
  const defaults = createDefaultState(meta);
  const filters = state.filters;
  const params = new URLSearchParams();

  const query = filters.search_query.trim();
  if (query.length > 0) params.set("q", query);

  if (filters.list_type.length > 0)
    params.set("type", filters.list_type.join(","));

  if (filters.genres.length > 0)
    params.set("genres", filters.genres.join(","));

  if (filters.hasDubbed.length > 0) {
    params.set("dub", filters.hasDubbed.map((v) => (v ? "1" : "0")).join(","));
  }
  if (filters.hasSubtitle.length > 0) {
    params.set(
      "sub",
      filters.hasSubtitle.map((v) => (v ? "1" : "0")).join(","),
    );
  }

  const votes = filters.imdb_votes_range;
  const defaultVotes = defaults.filters.imdb_votes_range;
  if (votes.low !== defaultVotes.low || votes.high !== defaultVotes.high) {
    params.set("votes", `${votes.low}-${votes.high}`);
  }

  const rate = filters.imdb_rate_range;
  const defaultRate = defaults.filters.imdb_rate_range;
  if (rate.low !== defaultRate.low || rate.high !== defaultRate.high) {
    params.set("rate", `${rate.low}-${rate.high}`);
  }

  const year = filters.year_range;
  const defaultYear = defaults.filters.year_range;
  if (year.low !== defaultYear.low || year.high !== defaultYear.high) {
    params.set("year", `${year.low}-${year.high}`);
  }

  const runtime = filters.runtime_range;
  const defaultRuntime = defaults.filters.runtime_range;
  if (runtime.low !== defaultRuntime.low || runtime.high !== defaultRuntime.high) {
    params.set("runtime", `${runtime.low}-${runtime.high}`);
  }

  if (state.sort.type !== defaults.sort.type)
    params.set("sort", state.sort.type);
  if (state.pageination.page > 1) {
    params.set("page", String(state.pageination.page));
  }

  return params;
}

export function dataTableReducer(
  state: DataTableState,
  action: DataTableAction,
  meta: SiteMeta,
): DataTableState {
  switch (action.type) {
    case "NEXT_PAGE":
      return setPage(state, state.pageination.page + 1);
    case "PREVIOUS_PAGE":
      return setPage(state, state.pageination.page - 1);
    case "SET_PAGE":
      return setPage(state, action.payload);
    case "RESET_PAGE":
      return setPage(state, 1);
    case "SET_SORT":
      return { ...setPage(state, 1), sort: action.payload };
    case "SET_FILTERS":
      return {
        ...setPage(state, 1),
        filters: { ...action.payload, search_query: state.filters.search_query },
      };
    case "RESET_FILTERS":
      return { ...setPage(state, 1), filters: createDefaultFilters(meta) };
  }
}

function setPage(state: DataTableState, page: number): DataTableState {
  return {
    ...state,
    pageination: { ...state.pageination, page: Math.max(1, Math.floor(page)) },
  };
}

// --- internals -------------------------------------------------------------

function parsePage(raw: string | null): number {
  const page = Number(raw);
  return Number.isInteger(page) && page > 1 ? page : 1;
}

function parseList<T extends string>(
  raw: string | null,
  allowed: readonly T[],
): T[] {
  if (!raw) return [];
  const out: T[] = [];
  for (const part of raw.split(",")) {
    const value = part.trim() as T;
    if (allowed.includes(value) && !out.includes(value)) out.push(value);
  }
  return out;
}

function parseBooleans(raw: string | null): boolean[] {
  if (!raw) return [];
  const out: boolean[] = [];
  for (const part of raw.split(",")) {
    if (part === "1" && !out.includes(true)) out.push(true);
    if (part === "0" && !out.includes(false)) out.push(false);
  }
  return out;
}

function parseRange(raw: string | null): { low: number; high: number } | null {
  if (!raw) return null;
  const [lowRaw, highRaw] = raw.split("-");
  const low = Number(lowRaw);
  const high = Number(highRaw);
  if (!Number.isFinite(low) || !Number.isFinite(high)) return null;
  return { low, high };
}

function parseSort(raw: string | null): SortTypes {
  return SORTING_UI.find((sort) => sort.type === raw) ?? DEFAULT_SORT;
}
