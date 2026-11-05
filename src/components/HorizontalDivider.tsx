import { cn } from "../lib/utils";

interface HorizontalDividerProps {
  /**
   * color of the divider, must be a tailwind bg-* token
   */
  color?: string;
}

export function HorizontalDivider({
  color = "bg-border",
}: HorizontalDividerProps) {
  return <div className={cn("h-px", color)}></div>;
}
