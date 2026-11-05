export const siteConfig = {
  name: "موویز",
  englishName: "Moovies",
  description: "موویز | دانلود فیلم و سریال رایگان بر اساس آرشیو دنیای سریال",
  englishDescription: "Moovies | download movies and series for free | based on donyayeserial archive",
  links: {
    github:
      "https://github.com/aminforouzan/Moovies",
    authorGithub: "https://github.com/aminforouzan",
    donyayeSerial: "http://donyayeserial.com",
    donation: "https://daramet.com/donyayeserial",
  },
  postersBaseUrl:
    (import.meta.env.VITE_POSTER_BASE_URL as string | undefined)?.replace(/\/+$/, "") ||
    "/posters",
} as const;

export type SiteConfig = typeof siteConfig;

export function getPosterUrl(imdbCode: string): string {
  return `${siteConfig.postersBaseUrl}/${imdbCode}.jpg`;
}
