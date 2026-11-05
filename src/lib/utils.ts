import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { FiltersUIData, SortTypes } from "./types";
import { GENRE_FA } from "./genres";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * helper function to format numbers into fa-IR strings
 * @param value the numeric value we want to format
 * @returns a string represnting the value in fa-IR locale
 */
export function faNumber(value: number) {
  return new Intl.NumberFormat("fa-IR").format(value);
}

/**
 * Format an ISO date string (YYYY-MM-DD) into a Persian (شمسی/Jalali)
 * date string using the fa-IR locale.
 * @param iso the ISO date string to format
 * @returns a Persian-formatted date string
 */
export function formatPersianDate(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat("fa-IR", {
      calendar: "persian",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(d);
  } catch {
    return iso;
  }
}

const FA_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

/**
 * Persian digits for strings that are not plain numbers — years and year
 * ranges like "2008-2013" or "2016-2025".
 */
export function formatVotes(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return Math.round(n / 1_000) + "k";
  return String(n);
}

export function faDigits(value: string) {
  return value.replace(/\d/g, (digit) => FA_DIGITS[Number(digit)]);
}

export const FILTERS_UI = [
  {
    key_in_filters: "list_type",
    filter_type: "check_box",
    title: "نوع اثر",
    options: [
      {
        value: "movie",
        display_string: "فیلم",
      },
      {
        value: "series",
        display_string: "سریال",
      },
    ],
  },
  {
    key_in_filters: "hasDubbed",
    filter_type: "check_box",
    title: "دوبله",
    options: [
      {
        value: true,
        display_string: "دارد",
      },
      {
        value: false,
        display_string: "ندارد",
      },
    ],
  },
  {
    key_in_filters: "hasSubtitle",
    filter_type: "check_box",
    title: "زیرنویس",
    options: [
      {
        value: true,
        display_string: "دارد",
      },
      {
        value: false,
        display_string: "ندارد",
      },
    ],
  },
  {
    key_in_filters: "year_range",
    title: "سال",
    filter_type: "range",
  },
  {
    key_in_filters: "imdb_rate_range",
    title: "امتیاز",
    filter_type: "range",
  },
  {
    key_in_filters: "imdb_votes_range",
    title: "تعداد رای",
    filter_type: "range",
  },
  {
    key_in_filters: "genres",
    filter_type: "pill",
    title: "ژانر",
    options: Object.keys(GENRE_FA).map((genre) => ({
      value: genre,
      display_string: GENRE_FA[genre],
    })),
  },
  {
    key_in_filters: "runtime_range",
    title: "مدت زمان",
    filter_type: "range",
  },
] satisfies FiltersUIData[];

export const DEFAULT_SORT: SortTypes = {
  type: "most-vote",
  label: "بیش‌ترین‌ رای",
};

export const SORTING_UI: SortTypes[] = [
  {
    type: "most-vote",
    label: "بیش‌ترین‌ رای",
  },
  {
    type: "least-vote",
    label: "کم‌ترین‌ رای",
  },
  {
    type: "most-score",
    label: "بیش‌ترین‌ امتیاز",
  },
  {
    type: "least-score",
    label: "کم‌ترین‌ امتیاز",
  },
];

// Counts how many top-level keys differ from defaults.
// Works for future changes as long as values are JSON-like / Arrays / Sets / Maps / Dates / primitives.
export function countChangedKeys<T extends Record<string, any>>(
  defaults: T,
  current: T,
): number {
  const keys = new Set<keyof T>([
    ...(Object.keys(defaults) as Array<keyof T>),
    ...(Object.keys(current) as Array<keyof T>),
  ]);

  let count = 0;
  for (const k of keys) {
    if (!deepEqual(defaults[k], current[k])) count++;
  }
  return count;
}

function deepEqual(a: any, b: any): boolean {
  // strings/booleans/numbers/bigints/symbols
  if (Object.is(a, b)) return true;

  // Handle null/undefined and different types early
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;

  // Arrays
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  // Objects (plain or class instances): compare enumerable own props
  if (typeof a === "object" && typeof b === "object") {
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    if (aKeys.length !== bKeys.length) return false;

    for (const k of aKeys) {
      if (!Object.prototype.hasOwnProperty.call(b, k)) return false;
      if (!deepEqual(a[k], b[k])) return false;
    }
    return true;
  }

  // Fallback for functions/symbols/etc.
  return false;
}
