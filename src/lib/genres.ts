/**
 * `data.json` stores IMDb's English genre names; the UI is Persian. Unknown
 * genres fall through unchanged so a new IMDb genre never renders as a blank.
 */
export const GENRE_FA: Record<string, string> = {
  Action: "اکشن",
  Adventure: "ماجراجویی",
  Animation: "انیمیشن",
  Biography: "زندگی‌نامه",
  Comedy: "کمدی",
  Crime: "جنایی",
  Documentary: "مستند",
  Drama: "درام",
  Family: "خانوادگی",
  Fantasy: "فانتزی",
  "Film-Noir": "نوآر",
  "Game-Show": "مسابقه",
  History: "تاریخی",
  Horror: "ترسناک",
  Music: "موسیقی",
  Musical: "موزیکال",
  Mystery: "معمایی",
  News: "خبری",
  "Reality-TV": "واقع‌نما",
  Romance: "عاشقانه",
  "Sci-Fi": "علمی-تخیلی",
  Short: "کوتاه",
  Sport: "ورزشی",
  "Talk-Show": "گفت‌وگو",
  Thriller: "دلهره‌آور",
  War: "جنگی",
  Western: "وسترن",
};

/** Persian label of one IMDb genre ("Crime" → "جنایی"). */
export function genreLabel(genre: string): string {
  return GENRE_FA[genre] ?? genre;
}

/** "Crime, Drama" → "جنایی، درام" */
export function genreList(genres: string[]): string {
  return genres.map(genreLabel).join("، ");
}
