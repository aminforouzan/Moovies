import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { SORTING_UI } from "@/lib/utils";
import { HorizontalDivider } from "../HorizontalDivider";
import { Check, X, ArrowDownWideNarrow } from "lucide-react";
import {
  useDataTable,
  useDataTableDispatch,
} from "../contexts/DataTableContext";

export function SortMobile() {
  const dataTableState = useDataTable();
  const dataTableDispatch = useDataTableDispatch();
  const sort = dataTableState.sort;

  return (
    <Drawer direction={"bottom"}>
      <DrawerTrigger asChild>
        <Button variant="outline" className="rounded-full">
          <ArrowDownWideNarrow />
          {sort.label}
        </Button>
      </DrawerTrigger>
      <DrawerContent
        className="data-[vaul-drawer-direction=bottom]:max-h-[70vh]"
        dir="rtl"
      >
        <DrawerHeader className="flex flex-row justify-between px-4 py-3">
          <DrawerTitle className="text-lg">مرتب سازی بر اساس</DrawerTitle>
          <DrawerClose asChild>
            <button type="button">
              <X />
            </button>
          </DrawerClose>
        </DrawerHeader>
        <DrawerDescription />
        <div className="flex flex-col overflow-y-auto px-4">
          {SORTING_UI.map((item, idx) => {
            const itemUI: React.ReactNode[] = [];
            itemUI.push(
              <DrawerClose asChild key={"sorting-button" + idx}>
                <button
                  className="flex items-center justify-between py-3"
                  type="button"
                  onClick={() =>
                    dataTableDispatch({ type: "SET_SORT", payload: item })
                  }
                >
                  <span>{item.label}</span>
                  {sort.type === item.type && <Check />}
                </button>
              </DrawerClose>,
            );
            if (idx < SORTING_UI.length - 1)
              itemUI.push(
                <HorizontalDivider
                  color="bg-border"
                  key={"sorting-divider" + idx}
                />,
              );
            return itemUI;
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
