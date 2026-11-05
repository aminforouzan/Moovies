import type { FilterPillUI, FiltersObj } from "@/lib/types";

export function isPillApplied(
  filterUIData: FilterPillUI,
  appliedFilters: FiltersObj,
) {
  const isApplied = appliedFilters[filterUIData.key_in_filters].length > 0;

  const arr: string[] = [];
  filterUIData.options.forEach((option) => {
    const key = filterUIData.key_in_filters;
    const value = option.value;
    const displayStr = option.display_string;
    const applied = appliedFilters[key].some((v) => v === value);
    if (applied) arr.push(displayStr);
  });
  const appliedString = arr.join("، ");

  return { isApplied, isAppliedStr: appliedString };
}