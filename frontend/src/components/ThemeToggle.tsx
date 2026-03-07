import { MoonIcon, SunIcon } from "@radix-ui/react-icons"
import * as Switch from "@radix-ui/react-switch"
import { useEffect, useState } from "react"
import { applyTheme, getInitialTheme, type ThemeMode } from "../lib/theme"

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(() => getInitialTheme())

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  return (
    <div className="theme-toggle-wrap">
      <SunIcon aria-hidden="true" />
      <Switch.Root
        aria-label="Toggle dark mode"
        checked={theme === "dark"}
        className="theme-switch"
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
      >
        <Switch.Thumb className="theme-switch-thumb" />
      </Switch.Root>
      <MoonIcon aria-hidden="true" />
    </div>
  )
}
