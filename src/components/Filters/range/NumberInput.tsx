import { Input } from "@/components/ui/input";
import { useState } from "react";

type NumberInputProps = Omit<
  React.ComponentProps<"input">,
  "value" | "onChange" | "min" | "max"
> & {
  minVal: number;
  maxVal: number;
  value: number;
  handleUpdate: (next: number) => void;
  bound: "low" | "high";
};

export function NumberInput({
  minVal,
  maxVal,
  value,
  handleUpdate,
  bound = "low",
  ...props
}: NumberInputProps) {
  const [text, setText] = useState(String(value));
  const [prevValue, setPrevValue] = useState(value);

  if (value !== prevValue) {
    setPrevValue(value);
    setText(String(value));
  }

  function commit() {
    if (text === String(value)) return;
    if (text === "") {
      const fallback = bound === "high" ? maxVal : minVal;
      handleUpdate(fallback);
      setText(String(fallback));
      return;
    }
    const n = Number(text);
    const clamped = Math.min(Math.max(n, minVal), maxVal);
    handleUpdate(clamped);
    setText(String(clamped));
  }

  return (
    <Input
      dir="ltr"
      className="w-full border-t-0 border-r-0 border-b-2 border-l-0 bg-transparent! text-center text-lg! font-bold"
      type="text"
      inputMode="numeric"
      value={text}
      onChange={(e) => {
        const next = e.target.value;
        if (/^\d*$/.test(next)) setText(next);
      }}
      onBlur={commit}
      {...props}
    />
  );
}
