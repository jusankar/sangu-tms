export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString() || "http://localhost:5000"

export const TENANT_CODE =
  import.meta.env.VITE_TENANT_CODE?.toString() || "default"

export const CHAT_API_BASE_URL =
  import.meta.env.VITE_CHAT_API_BASE_URL?.toString() || "http://localhost:5006"
