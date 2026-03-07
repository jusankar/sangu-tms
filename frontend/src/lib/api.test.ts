import { afterEach, describe, expect, it, vi } from "vitest"
import { api, ApiError } from "./api"
import { storage } from "./storage"

describe("api client", () => {
  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it("attaches auth and tenant headers", async () => {
    storage.setToken("test-token")

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: { get: () => "application/json" },
      json: async () => ({ accessToken: "a", userId: "u1", fullName: "Admin", isAdmin: true, permissions: [] }),
    })
    vi.stubGlobal("fetch", fetchMock)

    await api.login("admin@sangu.local", "Admin@123")

    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain("/api/auth/login")
    expect(init.headers.Authorization).toBe("Bearer test-token")
    expect(init.headers["X-Tenant-Code"]).toBeDefined()
  })

  it("throws ApiError on non-success responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        headers: { get: () => "application/json" },
        text: async () => "Unauthorized",
      })
    )

    await expect(api.me()).rejects.toBeInstanceOf(ApiError)
  })
})
