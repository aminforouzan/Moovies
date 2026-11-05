import { cn } from "../../lib/utils";

interface ButtonTextProps {
  type?: "submit" | "button" | "reset";
  text?: string;
  disabled: boolean;
  handleClick?: () => void;
}

export function ButtonText({
  type = "button",
  text = "text button",
  disabled,
  handleClick,
}: ButtonTextProps) {
  return (
    <button
      onClick={handleClick}
      type={type}
      className={cn(
        "min-w-fit cursor-pointer px-4 py-2",
        !disabled && "text-orange-600",
        disabled && "text-orange-300",
      )}
      disabled={disabled}
    >
      {text}
    </button>
  );
}
