import { rangeBounds } from "@/lib/data-table-url";
import type { FilterRangeUI, FiltersObj, SiteMeta } from "@/lib/types";
import { faDigits, faNumber } from "@/lib/utils";

export function isRangeApplied(
  filterUIData: FilterRangeUI,
  appliedFilters: FiltersObj,
  meta: SiteMeta,
) {
  // the minimum and maximum values this range can have
  const { low: minVal, high: maxVal } = rangeBounds(
    filterUIData.key_in_filters,
    meta,
  );
  //  the applied low and high value
  const apLowVal = appliedFilters[filterUIData.key_in_filters].low;
  const apHighVal = appliedFilters[filterUIData.key_in_filters].high;

  const lowStr = apLowVal > 100_000 ? faNumber(apLowVal) : faDigits(String(apLowVal))
  const highStr = apHighVal > 100_000 ? faNumber(apHighVal) : faDigits(String(apHighVal))

  let isApplied = false;
  if (apLowVal !== minVal || apHighVal !== maxVal) isApplied = true;

  const appliedString = `از ${lowStr} تا ${highStr}`;

  return { isApplied: isApplied, isAppliedStr: appliedString };
}
