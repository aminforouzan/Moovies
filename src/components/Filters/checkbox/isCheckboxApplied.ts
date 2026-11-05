import type { FilterCheckBoxUI, FiltersObj } from "@/lib/types";

export function isCheckboxApplied(
  filterUIData: FilterCheckBoxUI,
  appliedFilters: FiltersObj,
) {
  const isApplied = appliedFilters[filterUIData.key_in_filters].length > 0;

  const arr: string[] = [];
  filterUIData.options.forEach((option) => {
    const key = filterUIData.key_in_filters;
    const value = option.value;
    const displayStr = option.display_string;
    const isApplied = appliedFilters[key].some((v) => v === value);
    if (isApplied) arr.push(displayStr);
  });
  const appliedString = arr.join("، ");

  return { isApplied: isApplied, isAppliedStr: appliedString };
}
