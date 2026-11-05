import type {
  MovieLink,
  SeriesLink,
  TitleChunkEntry,
  TitleChunkFile,
  TitleDetails,
  TitleType,
} from "@/lib/types";

/**
 * `src/assets/data.json` carries the metadata of every title; the download
 * links live in `public/data_chunks/`, split across this many files so a title
 * page only pays for its own share.
 */
export const CHUNK_COUNT = 128;

const CHUNK_DIR = "data_chunks";
const IMDB_CODE_RE = /^tt(\d+)$/;

/**
 * Index of the chunk that holds a title:
 * `Number(imdb_code.slice(2)) % CHUNK_COUNT`.
 *
 * Returns null when the code is not `tt` followed by digits.
 */
export function chunkIndexFor(imdbCode: string): number | null {
  const match = IMDB_CODE_RE.exec(imdbCode);
  if (!match) return null;

  const id = Number(match[1]);
  if (!Number.isSafeInteger(id)) return null;

  return id % CHUNK_COUNT;
}

/** `chunk_000.json` … `chunk_127.json` */
export function chunkFileName(index: number): string {
  if (!Number.isInteger(index) || index < 0 || index >= CHUNK_COUNT) {
    throw new RangeError(`chunk index out of range: ${index}`);
  }
  return `chunk_${String(index).padStart(3, "0")}.json`;
}

/** Public url of a chunk, honouring a non-root deploy base. */
export function chunkUrl(index: number): string {
  const base = import.meta.env.BASE_URL || "/";
  return `${base.replace(/\/+$/, "")}/${CHUNK_DIR}/${chunkFileName(index)}`;
}

/**
 * Series links carry `seasons`; movie links are a flat list of files.
 * An empty list has no shape to read, so it is reported as "not a series".
 */
export function isSeriesLinkList(
  links: MovieLink[] | SeriesLink[],
): links is SeriesLink[] {
  return links.length > 0 && "seasons" in links[0];
}

/**
 * Types a raw chunk entry. Pass the title's `title_type` from `data.json` when
 * you have it: it is the only way to type an entry whose `links` are empty.
 */
export function toTitleDetails(
  entry: TitleChunkEntry,
  titleType?: TitleType,
): TitleDetails {
  const base = {
    imdb_code: entry.imdb_code,
    director: entry.director,
    writer: entry.writer,
    actors: entry.actors,
    plot: entry.plot,
  };
  const type = titleType ?? (isSeriesLinkList(entry.links) ? "series" : "movie");

  // The cast only states what the file already guarantees: the link shape is
  // authoritative for every entry that has links at all.
  return type === "series"
    ? { ...base, title_type: "series", links: entry.links as SeriesLink[] }
    : { ...base, title_type: "movie", links: entry.links as MovieLink[] };
}

/** One settled or in-flight request per chunk. */
const chunkCache = new Map<number, Promise<TitleChunkFile>>();

function loadChunk(index: number): Promise<TitleChunkFile> {
  const cached = chunkCache.get(index);
  if (cached) return cached;

  const url = chunkUrl(index);
  const request = fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`failed to load ${url}: ${response.status}`);
      }
      return response.json() as Promise<TitleChunkFile>;
    })
    .then((file) => {
      if (!Array.isArray(file)) {
        throw new Error(`${url} is not an array of titles`);
      }
      return file;
    })
    .catch((error: unknown) => {
      // Failures are never cached: a flaky network stays retryable.
      chunkCache.delete(index);
      throw error;
    });

  chunkCache.set(index, request);
  return request;
}

/**
 * Links plus director/writer/actors/plot of one title, read from the chunk its
 * imdb code points at. Each chunk is fetched by the browser at most once and
 * then served from memory, so moving between titles of the same chunk is free.
 */
export async function loadTitleDetails(
  imdbCode: string,
  titleType?: TitleType,
): Promise<TitleDetails | null> {
  const index = chunkIndexFor(imdbCode);
  if (index === null) return null;

  const file = await loadChunk(index);
  const entry = file.find((item) => item.imdb_code === imdbCode);

  return entry ? toTitleDetails(entry, titleType) : null;
}

/** Test seam: forget every cached chunk. */
export function clearTitleDetailsCache(): void {
  chunkCache.clear();
}
