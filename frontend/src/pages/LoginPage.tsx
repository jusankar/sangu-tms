import { useState } from "react"
import type { FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"
import { ApiError } from "../lib/api"
import { Button } from "../components/ui/button"
import { FormField } from "../components/ui/form-field"
import { Input } from "../components/ui/input"

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("admin@sangu.local")
  const [password, setPassword] = useState("Admin@123")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await login(email, password)
      navigate("/")
    } catch (err) {
      if (err instanceof Error && err.message === "Unexpected network error.") {
        setError("Cannot reach API. Check backend is running and VITE_API_BASE_URL is correct.")
      } else if (err instanceof ApiError) {
        setError(err.message || "Login failed")
      } else {
        setError(err instanceof Error ? err.message : "Login failed")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={onSubmit}>
        <h2 className="text-xl font-semibold tracking-tight">Sangu TMS Login</h2>
        <p className="text-sm text-muted-foreground">Use your tenant credentials</p>
        <FormField label="Email">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@sangu.local"
          />
        </FormField>
        <FormField label="Password">
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormField>
        {error ? <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div> : null}
        <Button className="w-full" disabled={loading} type="submit">
          {loading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </div>
  )
}
