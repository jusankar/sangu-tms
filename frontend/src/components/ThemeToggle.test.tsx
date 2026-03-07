import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import { ThemeToggle } from "./ThemeToggle"

describe("ThemeToggle", () => {
  afterEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute("data-theme")
    vi.restoreAllMocks()
  })

  it("switches between light and dark mode", async () => {
    render(<ThemeToggle />)
    const switchControl = screen.getByRole("switch", { name: /toggle dark mode/i })
    expect(switchControl).toHaveAttribute("data-state", "unchecked")

    await userEvent.click(switchControl)
    expect(switchControl).toHaveAttribute("data-state", "checked")
    expect(document.documentElement).toHaveAttribute("data-theme", "dark")
  })
})
