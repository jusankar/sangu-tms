import type { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { Label } from "./label"

type FormFieldProps = {
  label: ReactNode
  htmlFor?: string
  required?: boolean
  error?: string
  children: ReactNode
  className?: string
  fullWidth?: boolean
}

export function FormField({
  label,
  htmlFor,
  required,
  error,
  children,
  className,
  fullWidth,
}: FormFieldProps) {
  return (
    <div
      className={cn(
        "grid gap-1.5",
        fullWidth && "col-span-2",
        className
      )}
    >
      <Label htmlFor={htmlFor} className="text-foreground/90">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      {children}
      {error && (
        <small className="text-sm text-destructive">{error}</small>
      )}
    </div>
  )
}
