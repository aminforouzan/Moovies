import {
  useDraftFilters,
  useDraftFiltersDispatch,
} from "@/components/contexts/DraftFiltersContext";
import type { FilterCheckBoxUI } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { HorizontalDivider } from "@/components/HorizontalDivider";

export function FilterCheckbox({
  filterUIData,
}: {
  filterUIData: FilterCheckBoxUI;
}) {
  const draftFilters = useDraftFilters();
  const draftFiltersDispatch = useDraftFiltersDispatch();

  return (
    <div className="max-h-80 overflow-y-auto pb-3">
      <div className="flex flex-col">
        {filterUIData.options.map((option, idx) => {
          const key = filterUIData.key_in_filters;
          const value = option.value;
          // HACK in next line, to check memebrship of `value` in draftFilters, Array.prototype.some() is used instead of Array.prototype.includes() intentionally
          // `value` is a union of string and boolean. and also, `draftFilters[key]` is a union of boolean[] and string[]
          // so if you use .includes() method TS will show `never` error. although it's type is gauranteed to match in our data type. but the .some method lets you check mempership of `value` in the array, regardless of the fact the type of `v` and `value` are unions. comparing unions in TS is safe.
          const checked = draftFilters[key].some((v) => v === value);
          return (
            <div key={option.display_string + "checkbox" + idx}>
              <div className="flex items-center">
                <Checkbox
                  id={filterUIData.title + option.display_string + idx}
                  checked={checked}
                  className="relative bottom-px"
                  onCheckedChange={() =>
                    draftFiltersDispatch({
                      type: "TOGGLE_CHECKBOX",
                      payload: {
                        filter_key: key,
                        filter_value: value,
                        was_checked: checked,
                      },
                    })
                  }
                />
                <Label
                  htmlFor={filterUIData.title + option.display_string + idx}
                  className="w-full py-3 ps-3"
                >
                  {option.display_string}
                </Label>
              </div>
              {idx < filterUIData.options.length - 1 && (
                <HorizontalDivider color="bg-border" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
