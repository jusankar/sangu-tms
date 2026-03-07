import { logger } from "./logger"

export type ThemeMode = "light" | "dark"

const THEME_KEY = "sangu.theme"

export function getInitialTheme(): ThemeMode {
  try {
    const stored = localStorage.getItem(THEME_KEY)
    if (stored === "light" || stored === "dark") {
      return stored
    }
  } catch (error) {
    logger.warn("Unable to read theme from localStorage.", { error })
  }

  if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark"
  }
  return "light"
}

export function applyTheme(theme: ThemeMode) {
  document.documentElement.setAttribute("data-theme", theme)
  try {
    localStorage.setItem(THEME_KEY, theme)
  } catch (error) {
    logger.warn("Unable to persist theme preference.", { error })
  }
}
