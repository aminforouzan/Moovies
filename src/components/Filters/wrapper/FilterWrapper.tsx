import type { FilterCheckBoxUI, FilterPillUI, FilterRangeUI } from "@/lib/types";
import { FWDesktop } from "./FWDesktop";
import { FWMobileNotExpanded } from "./FWMobileNotExpanded";
import { FWMobileExpanded } from "./FWMobileExpanded";

export type FWBaseProps =
  | {
      type: "checkbox";
      filterUIData: FilterCheckBoxUI;
    }
  | {
      type: "range";
      filterUIData: FilterRangeUI;
    }
  | {
      type: "pill";
      filterUIData: FilterPillUI;
    };

export type MobileNotExpandedProps = FWBaseProps & {
  platform: "mobile-notExpanded";
  handleExpandClick: () => void;
};

type MobileExpandedProps = FWBaseProps & {
  platform: "mobile-expanded";
};

type DesktopProps = FWBaseProps & {
  platform: "desktop";
};

type FilterWrapperProps =
  | MobileExpandedProps
  | MobileNotExpandedProps
  | DesktopProps;

export function FilterWrapper(props: FilterWrapperProps) {
  switch (props.platform) {
    case "desktop": {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { platform, ...base } = props;
      return <FWDesktop {...base} />;
    }
    case "mobile-notExpanded": {
      return <FWMobileNotExpanded {...props} />;
    }
    case "mobile-expanded": {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { platform, ...base } = props;
      return <FWMobileExpanded {...base} />;
    }
  }
}
