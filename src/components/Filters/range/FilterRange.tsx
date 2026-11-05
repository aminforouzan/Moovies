import type { FilterRangeUI } from "@/lib/types";
import {
  useDraftFilters,
  useDraftFiltersDispatch,
} from "@/components/contexts/DraftFiltersContext";
import { NumberInput } from "@/components/Filters/range/NumberInput";
import { Slider } from "@/components/ui/slider";
import { useTableMeta } from "@/components/contexts/DataTableContext";
import { rangeBounds } from "@/lib/data-table-url";
import { faNumber, faDigits } from "@/lib/utils";

export function FilterRange({ filterUIData }: { filterUIData: FilterRangeUI }) {
  const draftFilters = useDraftFilters();
  const draftFiltersDispatch = useDraftFiltersDispatch();
  const meta = useTableMeta();

  // the current pending low and high value
  const lowVal = draftFilters[filterUIData.key_in_filters].low;
  const highVal = draftFilters[filterUIData.key_in_filters].high;
  // the minimum and maximum values this range can have
  const { low: minVal, high: maxVal } = rangeBounds(
    filterUIData.key_in_filters,
    meta,
  );

  return (
    <div className="mx-auto flex max-w-150 flex-col px-5 pb-3">
      <div className="mb-4 flex items-end">
        <label
          htmlFor={filterUIData.key_in_filters + "low"}
          className="pe-3 text-muted-foreground"
        >
          از
        </label>
        <NumberInput
          id={filterUIData.key_in_filters + "low"}
          value={lowVal}
          minVal={minVal}
          maxVal={maxVal}
          bound="low"
          handleUpdate={(next: number) =>
            draftFiltersDispatch({
              type: "UPDATE_RANGE",
              payload: {
                filter_key: filterUIData.key_in_filters,
                filter_dir: "low",
                value: Math.min(next, highVal),
              },
            })
          }
        />
      </div>
      <div className="mb-6 flex items-end">
        <label
          htmlFor={filterUIData.key_in_filters + "high"}
          className="pe-3 text-muted-foreground"
        >
          تا
        </label>
        <NumberInput
          id={filterUIData.key_in_filters + "high"}
          value={highVal}
          minVal={minVal}
          maxVal={maxVal}
          bound="high"
          handleUpdate={(next: number) =>
            draftFiltersDispatch({
              type: "UPDATE_RANGE",
              payload: {
                filter_key: filterUIData.key_in_filters,
                filter_dir: "high",
                value: Math.max(next, lowVal),
              },
            })
          }
        />
      </div>
      <div className="mb-3 px-1">
        <Slider
          dir="rtl"
          min={minVal}
          max={maxVal}
          step={1}
          value={[lowVal, highVal]}
          onValueChange={(vals) => {
            const [a, b] = vals as number[];
            const low = Math.min(a, b);
            const high = Math.max(a, b);
            draftFiltersDispatch({
              type: "UPDATE_RANGE",
              payload: {
                filter_key: filterUIData.key_in_filters,
                filter_dir: "low",
                value: low,
              },
            });
            draftFiltersDispatch({
              type: "UPDATE_RANGE",
              payload: {
                filter_key: filterUIData.key_in_filters,
                filter_dir: "high",
                value: high,
              },
            });
          }}
        />
        <div className="mt-3 grid grid-cols-2 items-center px-1 text-xs text-muted-foreground">
          <span className="text-start">{minVal >= 100_000 ? faNumber(minVal) : faDigits(String(minVal))}</span>
          <span className="text-end">{maxVal >= 100_000 ? faNumber(maxVal) : faDigits(String(maxVal))}</span>
        </div>
      </div>
    </div>
  );
}
