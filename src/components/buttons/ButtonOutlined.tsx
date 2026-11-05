import { faNumber } from "@/lib/utils";
import { Button } from "../ui/button";

type ButtonOutlinedProps = {
  type?: "submit" | "button" | "reset";
  notifNum?: number | null;
  handleClick?: () => void;
} & React.ComponentProps<"button">;

export function ButtonOutlined({
  type = "button",
  notifNum,
  handleClick,
  ...props
}: ButtonOutlinedProps) {
  if (notifNum)
    return (
      <div className="relative">
        <button
          onClick={handleClick}
          type={type}
          className="flex w-fit items-center gap-x-1 rounded-full bg-primary-soft py-2 ps-3 pe-4.5 text-sm font-medium text-primary-soft-foreground"
        >
          {props.children}
        </button>
        <div className="absolute -top-2 left-0 h-5 w-5 rounded-full bg-primary">
          <span className="absolute top-1/2 left-1/2 -translate-1/2 text-sm font-normal text-white">
            {faNumber(notifNum)}
          </span>
        </div>
      </div>
    );

  return (
    <Button
      variant="outline"
      className="rounded-full"
      onClick={handleClick}
      {...props}
    ></Button>
  );
}
