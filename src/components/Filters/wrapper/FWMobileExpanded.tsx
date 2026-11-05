import { FilterCheckbox } from "../checkbox/FilterCheckbox";
import { FilterRange } from "../range/FilterRange";
import { FilterPill } from "../pill/FilterPill";
import { type FWBaseProps } from "./FilterWrapper";

export function FWMobileExpanded({
  type,
  filterUIData,
}: FWBaseProps) {

  switch (type) {
    case "checkbox":
      return <FilterCheckbox filterUIData={filterUIData} />
    case "range":
      return <FilterRange filterUIData={filterUIData} />
    case "pill":
      return <FilterPill filterUIData={filterUIData} />
  }
  
}
