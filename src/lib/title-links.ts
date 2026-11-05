import type { MovieLink, SeriesLink, SeriesSeason } from "@/lib/types";

/**
 * Download links are stored in one flat list per title; the detail page shows
 * them grouped by audio/subtitle variant, in this order.
 */
export type LinkType = "dub" | "sub" | "nosub";

export const LINK_TYPE_ORDER: readonly LinkType[] = ["dub", "sub", "nosub"];

export interface MovieLinkGroup {
  type: LinkType;
  links: MovieLink[];
}

export interface SeriesLinkGroup {
  type: LinkType;
  seasons: SeriesSeason[];
}

/** Movies: one group per variant, files in their stored order. */
export function groupMovieLinks(links: MovieLink[]): MovieLinkGroup[] {
  return LINK_TYPE_ORDER.map((type) => ({
    type,
    links: links.filter((link) => link.type === type),
  })).filter((group) => group.links.length > 0);
}

/**
 * Series: one group per variant, seasons sorted numerically — the data is
 * `"1" … "10"`, so a string sort would put season 10 before season 2.
 */
export function groupSeriesLinks(links: SeriesLink[]): SeriesLinkGroup[] {
  return LINK_TYPE_ORDER.map((type) => ({
    type,
    seasons: links
      .filter((link) => link.type === type)
      .flatMap((link) => link.seasons)
      .sort((a, b) => seasonNumber(a) - seasonNumber(b)),
  })).filter((group) => group.seasons.length > 0);
}

/**
 * How many distinct seasons the title offers across every variant — the
 * "۵ فصل کامل" badge in the hero.
 */
export function countSeriesSeasons(links: SeriesLink[]): number {
  return new Set(links.flatMap((link) => link.seasons.map((s) => s.season)))
    .size;
}

function seasonNumber(season: SeriesSeason): number {
  const value = Number(season.season);
  return Number.isFinite(value) ? value : 0;
}
