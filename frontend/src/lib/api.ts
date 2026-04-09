import { API_BASE_URL, CHAT_API_BASE_URL, TENANT_CODE } from "./config"
import { logger } from "./logger"
import { storage } from "./storage"
import type {
  Branch,
  Consignment,
  ConsignmentUpsert,
  Driver,
  DriverUpsert,
  Invoice,
  InvoiceUpsert,
  Location,
  LocationUpsert,
  LoginResponse,
  MoneyReceipt,
  MoneyReceiptUpsert,
  ReportOutstanding,
  Vehicle,
  VehicleReceipt,
  VehicleReceiptUpsert,
  VehicleUpsert,
  TrafficPlanRequest,
  TrafficPlanResponse,
  TrafficPlanSummary,
  ChatAskResponse,
  VehicleTrackingData,
} from "../types"

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = storage.getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Code": TENANT_CODE,
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  try {
    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
    })

    if (!res.ok) {
      const text = await res.text()
      const message = text || `Request failed: ${res.status}`
      const isLoginRequest = path === "/api/auth/login"
      if (res.status === 401 && !isLoginRequest) {
        storage.clearAll()
        logger.warn("Received 401, clearing session and redirecting to login.", { path })
        if (window.location.pathname !== "/login") {
          window.location.href = "/login"
        }
      }
      logger.error("API request failed.", {
        message,
        path,
        status: res.status,
      })
      throw new ApiError(message, res.status)
    }

    if (res.status === 204) {
      return undefined as T
    }

    const contentType = res.headers.get("content-type") || ""
    if (!contentType.includes("application/json")) {
      return undefined as T
    }

    return (await res.json()) as T
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    logger.error("Unhandled API request exception.", { error, path })
    throw new Error("Unexpected network error.")
  }
}

async function requestChat<T>(path: string, init?: RequestInit): Promise<T> {
  const token = storage.getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Tenant-Code": TENANT_CODE,
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${CHAT_API_BASE_URL}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new ApiError(text || `Chat request failed: ${res.status}`, res.status)
  }

  return (await res.json()) as T
}

export const api = {
  login: (email: string, password: string) =>
    request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, tenantCode: TENANT_CODE }),
    }),

  me: () => request<{ fullName: string; email: string; permissions: string[] }>("/api/auth/me"),

  consignments: () => request<Consignment[]>("/api/consignments"),
  createConsignment: (payload: ConsignmentUpsert) =>
    request<Consignment>("/api/consignments", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateConsignment: (id: string, payload: ConsignmentUpsert) =>
    request<Consignment>(`/api/consignments/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteConsignment: (id: string) =>
    request<void>(`/api/consignments/${id}`, {
      method: "DELETE",
    }),
  branches: () =>
    request<Branch[]>("/api/branches"),
  createBranch: (payload: { code: string; name: string; address?: string; isActive: boolean }) =>
    request<Branch>("/api/branches", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateBranch: (
    id: string,
    payload: { code: string; name: string; address?: string; isActive: boolean }
  ) =>
    request<Branch>(`/api/branches/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteBranch: (id: string) =>
    request<void>(`/api/branches/${id}`, {
      method: "DELETE",
    }),
  locations: () =>
    request<Location[]>("/api/locations"),
  createLocation: (payload: LocationUpsert) =>
    request<Location>("/api/locations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateLocation: (id: string, payload: LocationUpsert) =>
    request<Location>(`/api/locations/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  drivers: () => request<Driver[]>("/api/drivers"),
  createDriver: (payload: DriverUpsert) =>
    request<Driver>("/api/drivers", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateDriver: (id: string, payload: DriverUpsert) =>
    request<Driver>(`/api/drivers/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteDriver: (id: string) =>
    request<void>(`/api/drivers/${id}`, {
      method: "DELETE",
    }),
  vehicles: () => request<Vehicle[]>("/api/vehicles"),
  createVehicle: (payload: VehicleUpsert) =>
    request<Vehicle>("/api/vehicles", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateVehicle: (id: string, payload: VehicleUpsert) =>
    request<Vehicle>(`/api/vehicles/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteVehicle: (id: string) =>
    request<void>(`/api/vehicles/${id}`, {
      method: "DELETE",
    }),
  vehicleReceipts: () => request<VehicleReceipt[]>("/api/challans"),
  createVehicleReceipt: (payload: VehicleReceiptUpsert) =>
    request<VehicleReceipt>("/api/challans", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  invoices: () => request<Invoice[]>("/api/invoices"),
  createInvoice: (payload: InvoiceUpsert) =>
    request<Invoice>("/api/invoices", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  receipts: () => request<MoneyReceipt[]>("/api/receipts"),
  createReceiptForInvoice: (invoiceId: string, payload: MoneyReceiptUpsert) =>
    request<MoneyReceipt>(`/api/invoices/${invoiceId}/receipts`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  customers: () =>
    request<
      Array<{
        id: string
        code: string
        name: string
        address?: string
        gstNo?: string
        mobile?: string
        creditDays: number
        isActive: boolean
      }>
    >("/api/customers"),
  createCustomer: (payload: {
    code: string
    name: string
    address?: string
    gstNo?: string
    mobile?: string
    creditDays: number
    isActive: boolean
  }) =>
    request<{
      id: string
      code: string
      name: string
      address?: string
      gstNo?: string
      mobile?: string
      creditDays: number
      isActive: boolean
    }>(
      "/api/customers",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    ),
  updateCustomer: (
    id: string,
    payload: {
      code: string
      name: string
      address?: string
      gstNo?: string
      mobile?: string
      creditDays: number
      isActive: boolean
    }
  ) =>
    request<{
      id: string
      code: string
      name: string
      address?: string
      gstNo?: string
      mobile?: string
      creditDays: number
      isActive: boolean
    }>(
      `/api/customers/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    ),
  deleteCustomer: (id: string) =>
    request<void>(`/api/customers/${id}`, {
      method: "DELETE",
    }),
  outstanding: () => request<ReportOutstanding[]>("/api/reports/outstanding"),
  trafficPlan: (payload: TrafficPlanRequest) =>
    request<TrafficPlanResponse>("/api/traffic/vehicle-placement/plan", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  trafficPlanList: (take = 50) =>
    request<TrafficPlanSummary[]>(`/api/traffic/vehicle-placement/plans?take=${take}`),
  trafficPlanById: (planId: string) =>
    request<TrafficPlanResponse>(`/api/traffic/vehicle-placement/plan/${planId}`),
  vehicleTracking: (vehicleNumber: string) =>
    request<VehicleTrackingData>(`/api/traffic/vehicle-tracking/${encodeURIComponent(vehicleNumber)}`),
  chatAsk: (message: string) =>
    requestChat<ChatAskResponse>("/api/chat/ask", {
      method: "POST",
      body: JSON.stringify({ message }),
    }),
}




