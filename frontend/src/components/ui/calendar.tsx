import { ChevronLeft, ChevronRight } from "lucide-react"
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
        month: "space-y-4 pt-10",
        caption: "absolute inset-x-0 top-2 flex items-center pointer-events-none",
        caption_label: "text-sm font-medium w-full text-center",
        nav: "absolute inset-x-0 top-2 flex items-center justify-between px-2",
        nav_button: cn(buttonVariants({ variant: "outline", size: "icon" }), "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"),
        nav_button_previous: "",
        nav_button_next: "",
        month_grid: "w-full border-collapse space-y-1",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        week: "flex w-full mt-2",
        day: "h-9 w-9 p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day_button: cn(buttonVariants({ variant: "ghost", size: "sm" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
        day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ className: iconClassName, orientation }) => {
          if (orientation === "left") return <ChevronLeft className={cn("h-4 w-4", iconClassName)} />
          if (orientation === "right") return <ChevronRight className={cn("h-4 w-4", iconClassName)} />
          return <ChevronRight className={cn("h-4 w-4", iconClassName)} />
        },
      }}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }

