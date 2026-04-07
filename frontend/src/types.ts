export type LoginResponse = {
  accessToken: string
  userId: string
  fullName: string
  isAdmin: boolean
  permissions: string[]
}

export type Consignment = {
  id: string
  consignmentNo: string
  branchId: string
  bookingDate: string
  customerId: string
  fromLocationId: string
  toLocationId: string
  consignorName?: string
  consignorAddress?: string
  consigneeName?: string
  consigneeAddress?: string
  consignorGstNo?: string
  consigneeGstNo?: string
  deliveryOfficeAddress?: string
  gstPayableBy?: string
  vehicleNo?: string
  privateMarkNo?: string
  packages: number
  goodsDescription?: string
  actualWeight: number
  chargedWeight: number
  ratePerQuintal: number
  basicFreight: number
  stCharge: number
  gstAmount: number
  hamaliCharge: number
  doorDeliveryCharge: number
  advancePaid: number
  collectionCharge: number
  paymentBasis?: string
  invoiceNo?: string
  invoiceDate?: string
  freightAmount: number
  status: string
  remarks?: string
}

export type ConsignmentUpsert = {
  consignmentNo?: string
  branchId: string
  bookingDate: string
  customerId: string
  fromLocationId: string
  toLocationId: string
  consignorName?: string
  consignorAddress?: string
  consigneeName?: string
  consigneeAddress?: string
  consignorGstNo?: string
  consigneeGstNo?: string
  deliveryOfficeAddress?: string
  gstPayableBy?: string
  vehicleNo?: string
  privateMarkNo?: string
  packages: number
  goodsDescription?: string
  actualWeight: number
  chargedWeight: number
  ratePerQuintal: number
  basicFreight: number
  stCharge: number
  gstAmount: number
  hamaliCharge: number
  doorDeliveryCharge: number
  advancePaid: number
  collectionCharge: number
  paymentBasis?: string
  invoiceNo?: string
  invoiceDate?: string
  freightAmount: number
  remarks?: string
}

export type ReportOutstanding = {
  invoiceId: string
  invoiceNo: string
  invoiceDate: string
  totalAmount: number
  receivedAmount: number
  outstandingAmount: number
  status: string
}

export type Invoice = {
  id: string
  invoiceNo: string
  branchId: string
  invoiceDate: string
  consignmentId: string
  challanIds: string[]
  taxableAmount: number
  gstAmount: number
  totalAmount: number
  receivedAmount: number
  dueDate?: string
  status: string
}

export type InvoiceUpsert = {
  invoiceNo?: string
  branchId: string
  invoiceDate: string
  consignmentId: string
  challanIds: string[]
  taxableAmount: number
  gstAmount: number
  totalAmount: number
  dueDate?: string
}

export type MoneyReceipt = {
  id: string
  invoiceId: string
  receiptNo: string
  branchId: string
  receiptDate: string
  amount: number
  mode: string
  referenceNo?: string
  status: string
}

export type MoneyReceiptUpsert = {
  receiptNo?: string
  branchId: string
  receiptDate: string
  amount: number
  mode: string
  referenceNo?: string
}

export type Branch = { id: string; code: string; name: string; address?: string; isActive: boolean }
export type Location = { id: string; code: string; name: string; stateName?: string; isActive: boolean }
export type Customer = {
  id: string
  code: string
  name: string
  address?: string
  gstNo?: string
  mobile?: string
  creditDays: number
  isActive: boolean
}
export type Driver = {
  id: string
  name: string
  licenseNo: string
  dateOfBirth?: string
  address?: string
  bloodGroup?: string
  mobile?: string
  isActive: boolean
}
export type Vehicle = {
  id: string
  vehicleNumber: string
  make?: string
  type?: string
  chassisNumber?: string
  engineNumber?: string
  isActive: boolean
}

export type DriverUpsert = Omit<Driver, "id">
export type VehicleUpsert = Omit<Vehicle, "id">
export type LocationUpsert = Omit<Location, "id">

export type VehicleReceiptLineUpsert = {
  consignmentId?: string
  consignorName?: string
  stationName?: string
  packages: number
  lrNo?: string
  weightKg: number
  description?: string
  freightAmount: number
}

export type VehicleReceiptUpsert = {
  challanNo?: string
  branchId: string
  challanDate: string
  fromLocationId?: string
  toLocationId?: string
  driverId?: string
  vehicleId?: string
  ownerName?: string
  vehicleNo?: string
  driverName?: string
  driverLicenseNo?: string
  driverMobile?: string
  balanceAt?: string
  freightAmount: number
  totalHire: number
  refBalance: number
  advanceAmount: number
  consignments: VehicleReceiptLineUpsert[]
}

export type VehicleReceipt = VehicleReceiptUpsert & {
  id: string
  challanNo: string
  paidAmount: number
  status: string
  consignments: Array<VehicleReceiptLineUpsert>
}

export type TrafficMaterial = {
  id: string
  length: number
  width: number
  height: number
  weight: number
  qty: number
  stackable: boolean
  maxStack?: number
}

export type TrafficTrailerType = {
  type: string
  L: number
  W: number
  H: number
  maxWeight: number
}

export type TrafficPlanRequest = {
  materials: TrafficMaterial[]
  trailers: TrafficTrailerType[]
  allowRotation: boolean
  allowStacking: boolean
}

export type TrafficTrailerItemPlan = {
  materialId: string
  quantity: number
  stackCount: number
}

export type TrafficPlacement = {
  materialId: string
  quantity: number
  stackCount: number
  x: number
  y: number
  z: number
  length: number
  width: number
  height: number
  weight: number
}

export type TrafficTrailerPlan = {
  trailerType: string
  trailerLength: number
  trailerWidth: number
  trailerHeight: number
  totalWeight: number
  items: TrafficTrailerItemPlan[]
  placements: TrafficPlacement[]
}

export type TrafficPlanResponse = {
  planId?: string
  recommendedTrailerType: string
  totalTrailers: number
  trailers: TrafficTrailerPlan[]
  warnings: string[]
  mode: string
}

export type TrafficPlanSummary = {
  planId: string
  recommendedTrailerType: string
  totalTrailers: number
  mode: string
  createdAt: string
}

export type ChatAskResponse = {
  answer: string
  success: boolean
  intent: string
  data?: Record<string, unknown>
}

