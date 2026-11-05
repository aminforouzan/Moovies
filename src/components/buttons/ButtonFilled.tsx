interface ButtonFilledProps {
  type?: "submit" | "button" | "reset";
  text?: string;
  handleClick?: () => void;
}

export function ButtonFilled({
  type = "button",
  text = "filled button",
  handleClick,
}: ButtonFilledProps) {
  return (
    <button
      onClick={handleClick}
      type={type}
      className="w-full cursor-pointer rounded-lg bg-primary px-4 py-2 text-primary-foreground"
    >
      {text}
    </button>
  );
}
