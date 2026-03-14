import { format, parseISO } from "date-fns"
import type { DateRange } from "react-day-picker"

import { Button } from "./button"
import { Calendar } from "./calendar"
import { FormField } from "./form-field"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

type DateRangePickerProps = {
  from: string
  to: string
  onFromChange: (value: string) => void
  onToChange: (value: string) => void
  fromLabel?: string
  toLabel?: string
}

export function DateRangePicker({
  from,
  to,
  onFromChange,
  onToChange,
  fromLabel = "From",
  toLabel = "To",
}: DateRangePickerProps) {
  const range: DateRange | undefined =
    from || to
      ? {
          from: from ? parseISO(from) : undefined,
          to: to ? parseISO(to) : undefined,
        }
      : undefined

  const label = `${fromLabel} - ${toLabel}`
  const buttonText =
    range?.from && range?.to
      ? `${format(range.from, "dd MMM yyyy")} - ${format(range.to, "dd MMM yyyy")}`
      : range?.from
        ? `${format(range.from, "dd MMM yyyy")} - …`
        : "Pick a date range"

  return (
    <div className="date-range-picker">
      <FormField label={label} fullWidth>
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" className="w-full justify-start text-left font-normal">
              {buttonText}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={range}
              onSelect={(next) => {
                const nextFrom = next?.from ? format(next.from, "yyyy-MM-dd") : ""
                const nextTo = next?.to ? format(next.to, "yyyy-MM-dd") : ""
                onFromChange(nextFrom)
                onToChange(nextTo)
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </FormField>
    </div>
  )
}
