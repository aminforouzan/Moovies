import { type MobileNotExpandedProps } from "./FilterWrapper";
import { ChevronLeft } from "lucide-react";
import { isCheckboxApplied } from "@/components/Filters/checkbox/isCheckboxApplied";
import {
  useDataTable,
  useTableMeta,
} from "@/components/contexts/DataTableContext";
import { isRangeApplied } from "../range/isRangeApplied";
import { isPillApplied } from "../pill/isPillApplied";

export function FWMobileNotExpanded({
  type,
  filterUIData,
  handleExpandClick,
}: MobileNotExpandedProps) {
  const appliedFilters = useDataTable().filters;
  const meta = useTableMeta();

  let isApplied = false,
    isAppliedStr = "";

  if (type === "checkbox") {
    ({ isApplied, isAppliedStr } = isCheckboxApplied(
      filterUIData,
      appliedFilters,
    ));
  } else if (type === "range") {
    ({ isApplied, isAppliedStr } = isRangeApplied(
      filterUIData,
      appliedFilters,
      meta,
    ));
  } else if (type === "pill") {
    ({ isApplied, isAppliedStr } = isPillApplied(filterUIData, appliedFilters));
  }

  return (
    <button
      type="button"
      onClick={handleExpandClick}
      className="w-full cursor-pointer py-3"
    >
      <div className="flex w-full justify-between">
        <div className="flex items-center gap-x-3">
          <span className="font-medium">{filterUIData.title}</span>
          {isApplied && (
            <div className="h-1 w-1 rounded-full bg-blue-400"></div>
          )}
        </div>
        <ChevronLeft size={22} />
      </div>
      {isApplied && (
        <div>
          <p className="w-fit text-start text-sm text-muted-foreground">
            {isAppliedStr}
          </p>
        </div>
      )}
    </button>
  );
}
