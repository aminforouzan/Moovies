import { cn, SORTING_UI } from "@/lib/utils";
import { ArrowDownWideNarrow } from "lucide-react";
import {
  useDataTable,
  useDataTableDispatch,
} from "../contexts/DataTableContext";

export function SortDesktop() {
  const dataTableState = useDataTable();
  const dataTableDispatch = useDataTableDispatch();
  const sort = dataTableState.sort;

  return (
    <div className="flex items-center gap-x-4 py-2">
      <div className="flex gap-x-1.5">
        <ArrowDownWideNarrow />
        <span className="text-[0.9375rem] font-medium">مرتب سازی:</span>
      </div>
      {SORTING_UI.map((item, idx) => {
        return (
          <button
            onClick={() =>
              dataTableDispatch({ type: "SET_SORT", payload: item })
            }
            type="button"
            key={"sorting-item" + idx}
            className={cn(
              item.type === sort.type && "text-orange-600",

              "transition-all",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
