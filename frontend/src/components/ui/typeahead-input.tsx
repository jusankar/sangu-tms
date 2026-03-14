import type { InputHTMLAttributes } from "react"
import { Input } from "./input"
import { cn } from "@/lib/utils"

type TypeaheadInputProps = InputHTMLAttributes<HTMLInputElement> & {
  options: string[]
  listId: string
}

export function TypeaheadInput({
  options,
  listId,
  className,
  ...props
}: TypeaheadInputProps) {
  return (
    <>
      <Input
        list={listId}
        className={cn("w-full", className)}
        autoComplete="off"
        {...props}
      />
      <datalist id={listId}>
        {options.map((opt) => (
          <option key={opt} value={opt} />
        ))}
      </datalist>
    </>
  )
}
