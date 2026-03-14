import { cn } from "@/lib/utils"

type TabsProps = {
  children: React.ReactNode
  className?: string
}

function Tabs({ children, className }: TabsProps) {
  return (
    <div className={cn("inline-flex gap-1 rounded-lg bg-muted p-1", className)}>
      {children}
    </div>
  )
}

type TabsTriggerProps = {
  active?: boolean
  children: React.ReactNode
  className?: string
} & React.ButtonHTMLAttributes<HTMLButtonElement>

function TabsTrigger({
  active,
  children,
  className,
  ...props
}: TabsTriggerProps) {
  return (
    <button
      type="button"
      role="tab"
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-all",
        "hover:bg-accent/80 hover:text-accent-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export { Tabs, TabsTrigger }
