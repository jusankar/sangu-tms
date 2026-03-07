import { afterEach, describe, expect, it, vi } from "vitest"
import { applyTheme, getInitialTheme } from "./theme"

describe("theme helpers", () => {
  afterEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute("data-theme")
    vi.restoreAllMocks()
  })

  it("uses persisted theme when available", () => {
    localStorage.setItem("sangu.theme", "dark")
    expect(getInitialTheme()).toBe("dark")
  })

  it("falls back to light theme without a preference", () => {
    expect(getInitialTheme()).toBe("light")
  })

  it("applies theme to root element and local storage", () => {
    applyTheme("dark")
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark")
    expect(localStorage.getItem("sangu.theme")).toBe("dark")
  })
})
