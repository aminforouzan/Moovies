import { HorizontalDivider } from "@/components/HorizontalDivider";
import { ButtonFilled } from "@/components/buttons/ButtonFilled";
import { ButtonText } from "@/components/buttons/ButtonText";
import { useDataTable, useTableMeta } from "@/components/contexts/DataTableContext";
import { createDefaultFilters } from "@/lib/data-table-url";
import { countChangedKeys } from "@/lib/utils";

interface FilterMobileFooterProps {
  handleApplyClick: () => void;
  handleClearClick: () => void;
}

export function FilterMobileFooter({
  handleApplyClick,
  handleClearClick,
}: FilterMobileFooterProps) {
  const appliedFilters = useDataTable().filters;
  const meta = useTableMeta();
  const isClean =
    countChangedKeys(createDefaultFilters(meta), appliedFilters) === 0;

  return (
    <div>
      <HorizontalDivider color="bg-border" />
      <div className="flex gap-4 px-5 py-4">
        <div className="w-full">
          <ButtonFilled
            type="button"
            text="اعمال فیلترها"
            handleClick={handleApplyClick}
          />
        </div>
        <ButtonText
          type="button"
          text="حذف فیلترها"
          disabled={isClean}
          handleClick={handleClearClick}
        />
      </div>
    </div>
  );
}
