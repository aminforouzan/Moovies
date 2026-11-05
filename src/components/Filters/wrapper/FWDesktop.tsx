import { type FWBaseProps } from "./FilterWrapper";
import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FilterCheckbox } from "../checkbox/FilterCheckbox";
import { isCheckboxApplied } from "@/components/Filters/checkbox/isCheckboxApplied";
import { useDataTable, useTableMeta } from "@/components/contexts/DataTableContext";
import { FilterRange } from "../range/FilterRange";
import { FilterPill } from "../pill/FilterPill";
import { isPillApplied } from "../pill/isPillApplied";
import { isRangeApplied } from "../range/isRangeApplied";

export function FWDesktop({
  type,
  filterUIData,
}: FWBaseProps) {
  const [showDropdown, setShowdropdown] = useState(false);
  const appliedFilters = useDataTable().filters;
  const meta = useTableMeta();

  let filterContent: React.ReactNode,
    isApplied = false,
    isAppliedStr = "";

  if (type === "checkbox") {
    filterContent = <FilterCheckbox filterUIData={filterUIData} />;
    ({ isApplied, isAppliedStr } = isCheckboxApplied(
      filterUIData,
      appliedFilters,
    ));
  } else if (type === "range") {
    filterContent = <FilterRange filterUIData={filterUIData} />;
    ({ isApplied, isAppliedStr } = isRangeApplied(
      filterUIData,
      appliedFilters,
      meta,
    ));
  } else if (type === "pill") {
    filterContent = <FilterPill filterUIData={filterUIData} />;
    ({ isApplied, isAppliedStr } = isPillApplied(filterUIData, appliedFilters));
  }

  return (
    <div>
      <button
        className="flex w-full cursor-pointer flex-col py-3"
        onClick={() => setShowdropdown(!showDropdown)}
      >
        <div className="flex justify-between">
          <div className="flex items-center gap-x-3">
            <p className="font-medium">{filterUIData.title}</p>
            {isApplied && (
              <div className="h-1 w-1 rounded-full bg-blue-400"></div>
            )}
          </div>
          <ChevronDown size={22} />
        </div>
        {!showDropdown && isApplied && (
          <div>
            <p className="w-fit text-sm text-muted-foreground text-start">
              {isAppliedStr}
            </p>
          </div>
        )}
      </button>
      {showDropdown && filterContent}
    </div>
  );
}
