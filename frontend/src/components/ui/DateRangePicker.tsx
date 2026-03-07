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
  return (
    <div className="date-range-picker">
      <label>
        {fromLabel}
        <input type="date" value={from} onChange={(e) => onFromChange(e.target.value)} />
      </label>
      <label>
        {toLabel}
        <input type="date" value={to} onChange={(e) => onToChange(e.target.value)} />
      </label>
    </div>
  )
}
