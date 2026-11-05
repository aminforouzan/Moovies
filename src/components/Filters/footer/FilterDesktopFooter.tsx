import { ButtonFilled } from "@/components/buttons/ButtonFilled";
import { ButtonText } from "@/components/buttons/ButtonText";
import { useDataTable, useTableMeta } from "@/components/contexts/DataTableContext";
import { createDefaultFilters } from "@/lib/data-table-url";
import { countChangedKeys } from "@/lib/utils";

interface FilterDesktopFooterProps {
  handleApplyClick: () => void;
  handleClearClick: () => void;
}

export function FilterDesktopFooter({
  handleApplyClick,
  handleClearClick,
}: FilterDesktopFooterProps) {
  const appliedFilters = useDataTable().filters;
  const meta = useTableMeta();
  const isClean =
    countChangedKeys(createDefaultFilters(meta), appliedFilters) === 0;

  return (
    <div className="flex gap-3 p-4">
      <ButtonFilled
        type="button"
        text="اعمال فیلترها"
        handleClick={handleApplyClick}
      />
      <ButtonText
        type="button"
        text="حذف فیلترها"
        disabled={isClean}
        handleClick={handleClearClick}
      />
    </div>
  );
}
