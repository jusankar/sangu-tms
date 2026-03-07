import { createContext, useContext, useMemo, useState } from "react"
import { api } from "../lib/api"
import { storage } from "../lib/storage"
import type { LoginResponse } from "../types"

type AuthUser = Pick<LoginResponse, "userId" | "fullName" | "isAdmin" | "permissions">

type AuthContextValue = {
  token: string | null
  user: AuthUser | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function loadInitialUser(): AuthUser | null {
  const raw = storage.getUser()
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(storage.getToken())
  const [user, setUser] = useState<AuthUser | null>(loadInitialUser())

  const value = useMemo<AuthContextValue>(
    () => ({
      token,
      user,
      login: async (email: string, password: string) => {
        const result = await api.login(email, password)
        const authUser: AuthUser = {
          userId: result.userId,
          fullName: result.fullName,
          isAdmin: result.isAdmin,
          permissions: result.permissions,
        }
        storage.setToken(result.accessToken)
        storage.setUser(JSON.stringify(authUser))
        setToken(result.accessToken)
        setUser(authUser)
      },
      logout: () => {
        storage.clearAll()
        setToken(null)
        setUser(null)
      },
    }),
    [token, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}

