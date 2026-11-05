// Types describing our Data
export interface MovieLink {
  resolution: string;
  url: string;
  size: string;
  type: "sub" | "dub" | "nosub";
}

export interface MovieData {
  title: string;
  imdb_code: string;
  title_type: "movie";
  imdb_votes: string;
  imdb_rate: string;
  subtitle: boolean;
  dubbed: boolean;
  nosub: boolean;
  links: MovieLink[];
}

export interface SeriesSeason {
  season: string;
  links: {
    resolution: string;
    url: string;
  }[];
}

export interface SeriesLink {
  type: "sub" | "dub" | "nosub";
  seasons: SeriesSeason[];
}

export interface SeriesData {
  title: string;
  imdb_code: string;
  title_type: "series";
  imdb_votes: string;
  imdb_rate: string;
  subtitle: boolean;
  dubbed: boolean;
  nosub: boolean;
  links: SeriesLink[];
}

export type TitleType = "movie" | "series";

/** One row of `data.json` → `titles[]`. */
export interface TitleRecord {
  title: string;
  imdb_code: string;
  title_type: TitleType;
  imdb_votes: number;
  imdb_rate: number;
  subtitle: boolean;
  dubbed: boolean;
  nosub: boolean;
  year: string | null;
  runtime: number | null;
  genres: string[];
  version_added: string;
}

export interface SiteMeta {
  total_num: number;
  movies_num: number;
  series_num: number;
  min_vote_count: number;
  max_vote_count: number;
  min_year: number;
  max_year: number;
  min_runtime: number;
  max_runtime: number;
  all_genres: string[];
  version: string;
  last_updated: string;
}

/** Root of `src/assets/data.json` */
export interface SiteDataFile {
  meta: SiteMeta;
  titles: TitleRecord[];
}
export interface TitleChunkEntry {
  imdb_code: string;
  /** `MovieLink[]` for movies, `SeriesLink[]` for series */
  links: MovieLink[] | SeriesLink[];
  /** comma separated names, null when unknown */
  director: string | null;
  /** comma separated names, null when unknown */
  writer: string | null;
  /** comma separated names, null when unknown */
  actors: string | null;
  /** null when unknown */
  plot: string | null;
}

/** A whole `chunk_NNN.json`: a top-level array, not an object. */
export type TitleChunkFile = TitleChunkEntry[];

interface TitleDetailsBase {
  imdb_code: string;
  director: string | null;
  writer: string | null;
  actors: string | null;
  plot: string | null;
}

/** A chunk entry proven to be a movie. */
export interface MovieDetails extends TitleDetailsBase {
  title_type: "movie";
  links: MovieLink[];
}

/** A chunk entry proven to be a series. */
export interface SeriesDetails extends TitleDetailsBase {
  title_type: "series";
  links: SeriesLink[];
}

/** What `loadTitleDetails()` resolves to: a chunk entry, typed. */
export type TitleDetails = MovieDetails | SeriesDetails;

type FilterRange = {
  low: number;
  high: number;
};

export interface FiltersObj {
  search_query: string;
  invalid?: boolean;
  imdb_votes_range: FilterRange;
  imdb_rate_range: FilterRange;
  year_range: FilterRange;
  runtime_range: FilterRange;
  list_type: Array<"series" | "movie">;
  hasSubtitle: Array<boolean>;
  hasDubbed: Array<boolean>;
  genres: string[];
}

export type SortTypes =
  | {
      type: "most-vote";
      label: "بیش‌ترین‌ رای";
    }
  | {
      type: "least-vote";
      label: "کم‌ترین‌ رای";
    }
  | {
      type: "most-score";
      label: "بیش‌ترین‌ امتیاز";
    }
  | {
      type: "least-score";
      label: "کم‌ترین‌ امتیاز";
    };

export interface DataTableState {
  filters: FiltersObj;
  sort: SortTypes;
  pageination: { page: number; pageSize: number };
}

export type DataTableAction =
  // pageination actions
  | { type: "NEXT_PAGE" }
  | { type: "PREVIOUS_PAGE" }
  | { type: "SET_PAGE"; payload: number }
  | { type: "RESET_PAGE" }
  // sort actions
  | { type: "SET_SORT"; payload: SortTypes }
  // filters actions
  | { type: "RESET_FILTERS" }
  | { type: "SET_FILTERS"; payload: FiltersObj };

// Filters types
export interface FilterSearchBox {
  key_in_filters: "search_query";
  filter_type: "search_box";
}

type FilterRangeKeys =
  "imdb_votes_range" | "imdb_rate_range" | "year_range" | "runtime_range";
export interface FilterRangeUI {
  key_in_filters: FilterRangeKeys;
  title: string;
  filter_type: "range";
}

// 1. keys in FiltersObj that can be a checkbox
type FilterCheckBoxKeys = "list_type" | "hasSubtitle" | "hasDubbed";
// 2. what type each value inside array of these keys have
type CheckBoxOptionValueForKeys<K extends FilterCheckBoxKeys> =
  FiltersObj[K][number];
// 3. the type of checkbox filters for those specific keys, value in options array now is linked to the specific key it has
interface FilterCheckBox<K extends FilterCheckBoxKeys> {
  key_in_filters: K;
  filter_type: "check_box";
  title: string;
  options: {
    value: CheckBoxOptionValueForKeys<K>;
    display_string: string;
  }[];
}
// 4. now create a union of different 'FilterCheckBox<K>'s that here K is different for each one of them, this is needed to later be used in components and components can understand different K values
export type FilterCheckBoxUI = {
  [K in FilterCheckBoxKeys]: FilterCheckBox<K>;
}[FilterCheckBoxKeys];

// Pill filter (rounded toggle buttons, multi-select)
type FilterPillKeys = "genres";
interface FilterPill<K extends FilterPillKeys> {
  key_in_filters: K;
  filter_type: "pill";
  title: string;
  options: {
    value: FiltersObj[K][number];
    display_string: string;
  }[];
}
export type FilterPillUI = {
  [K in FilterPillKeys]: FilterPill<K>;
}[FilterPillKeys];

// later other types of Expandalbe filters might exist (range, etc ...)
export type ExpandableFilters = FilterCheckBoxUI | FilterRangeUI | FilterPillUI;

// later other types of non-Expandalbe filters might exist
type nonExpandableFilters = never;

export type FiltersUIData = ExpandableFilters | nonExpandableFilters;

export type DraftFiltersAction<
  K extends FilterCheckBoxKeys = FilterCheckBoxKeys,
> =
  | { type: "RESET_DRAFT_FILTERS" }
  | {
      type: "TOGGLE_CHECKBOX";
      payload: {
        filter_key: K;
        filter_value: CheckBoxOptionValueForKeys<K>;
        was_checked: boolean;
      };
    }
  | { type: "RESET_DRAFT_SEARCH_QUERY" }
  | { type: "UPDATE_DRAFT_SEARCH_QUERY"; payload: string }
  | {
      type: "TOGGLE_PILL";
      payload: {
        filter_key: FilterPillKeys;
        filter_value: string;
        was_checked: boolean;
      };
    }
  | {
      type: "UPDATE_RANGE";
      payload: {
        filter_key: FilterRangeKeys;
        filter_dir: "low" | "high";
        value: number;
      };
    };
