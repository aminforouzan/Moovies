import { cn } from "../lib/utils";

interface VerticalDividerProps {
  /**
   * color of the divider, must be a tailwind bg-* token
   */
  color?: string;
}

export function VerticalDivider({ color = "bg-border" }: VerticalDividerProps) {
  return <div className={cn("w-px", color)}></div>;
}
