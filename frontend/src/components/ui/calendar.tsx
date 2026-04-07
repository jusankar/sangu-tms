import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      weekStartsOn={0}
      className={cn("p-2", className)}
      classNames={{
        months: "relative flex flex-col gap-4 sm:flex-row sm:gap-6",
        month: "relative space-y-4 pt-10",
        month_caption: "absolute left-1/2 top-2 z-10 flex -translate-x-1/2 items-center gap-2",
        caption_label: "inline-flex items-center gap-1 text-sm font-medium",
        nav: "pointer-events-none absolute inset-x-0 top-2 z-10 flex items-center justify-between px-2",
        button_previous: cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "pointer-events-auto h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline", size: "icon" }),
          "pointer-events-auto h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        dropdowns: "flex items-center gap-2",
        dropdown_root: "relative inline-flex items-center",
        dropdown: "absolute inset-0 h-full w-full cursor-pointer opacity-0",
        chevron: "h-4 w-4 opacity-70",
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        weeks: "flex flex-col gap-1",
        week: "flex w-full",
        day: "h-9 w-9 p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day_button: cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
        selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ className: iconClassName, orientation }) => {
          if (orientation === "left") return <ChevronLeft className={cn("h-4 w-4", iconClassName)} />
          if (orientation === "right") return <ChevronRight className={cn("h-4 w-4", iconClassName)} />
          if (orientation === "up") return <ChevronUp className={cn("h-4 w-4", iconClassName)} />
          if (orientation === "down") return <ChevronDown className={cn("h-4 w-4", iconClassName)} />
          return <ChevronRight className={cn("h-4 w-4", iconClassName)} />
        },
      }}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }

