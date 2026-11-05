import {
  useDraftFilters,
  useDraftFiltersDispatch,
} from "@/components/contexts/DraftFiltersContext";
import type { FilterPillUI } from "@/lib/types";
import { cn } from "cn";

export function FilterPill({ filterUIData }: { filterUIData: FilterPillUI }) {
  const draftFilters = useDraftFilters();
  const draftFiltersDispatch = useDraftFiltersDispatch();

  return (
    <div className="flex flex-wrap gap-2 pt-2 pb-4">
      {filterUIData.options.map((option, idx) => {
        const value = option.value;
        const checked = draftFilters.genres.some((v) => v === value);
        return (
          <button
            key={option.display_string + "pill" + idx}
            type="button"
            onClick={() =>
              draftFiltersDispatch({
                type: "TOGGLE_PILL",
                payload: {
                  filter_key: filterUIData.key_in_filters,
                  filter_value: value,
                  was_checked: checked,
                },
              })
            }
            className={cn(
              "rounded-full border px-2 py-1 text-sm",
              checked
                ? "border-primary-soft-border bg-primary-soft text-primary-soft-foreground"
                : "border-border text-muted-foreground",
            )}
          >
            {option.display_string}
          </button>
        );
      })}
    </div>
  );
}
