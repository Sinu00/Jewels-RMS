export type UserRole = 'ADMIN' | 'STAFF'
export type RentalStatus = 'BOOKED' | 'ACTIVE' | 'OVERDUE' | 'EXTENDED' | 'RETURNED' | 'CANCELLED'
export type PaymentPlan = 'HALF_ADVANCE' | 'FULL_RENT_DEFER_DEPOSIT' | 'FULL_UPFRONT'
export type PaymentType =
  | 'RENTAL'
  | 'RENTAL_ADVANCE'
  | 'RENTAL_BALANCE'
  | 'DEPOSIT'
  | 'DEPOSIT_REFUND'
  | 'DEPOSIT_WITHHELD'
  | 'OTHER'
export type PaymentMethod = 'CASH' | 'UPI' | 'BANK_TRANSFER'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  outletId: string
  outletName: string
}

export interface Outlet {
  id: string
  name: string
  address: string | null
  phone: string | null
  createdAt: string
  updatedAt: string
}

export interface OrnamentImage {
  id: string
  ornamentId: string
  url: string
  displayOrder: number
  createdAt: string
}

export interface CurrentRentalInfo {
  rentalId: string
  rentalNumber: string
  customerName: string
  dueDate: string
}

export interface Ornament {
  id: string
  outletId: string
  itemCode: string
  name: string
  category: string
  weightGrams: number | null
  baseRatePerDay: number
  description: string | null
  isAvailable: boolean
  /**
   * Number of future bookings for this ornament (status=BOOKED, startDate>=today).
   * This is an inventory-level signal; it does not encode availability for a specific date range.
   */
  futureBookingsCount?: number
  isDeleted: boolean
  images: OrnamentImage[]
  currentRental?: CurrentRentalInfo
  createdAt: string
  updatedAt: string
}

export interface Customer {
  id: string
  outletId: string
  name: string
  phone: string
  address: string | null
  idProofType: string | null
  idProofNumber: string | null
  isDeleted: boolean
  activeRentalsCount?: number
  createdAt: string
  updatedAt: string
}

export interface RentalItemDetail {
  id: string
  ornamentId: string
  ornament: Pick<Ornament, 'id' | 'itemCode' | 'name' | 'category' | 'images'>
  ratePerDay: number
  totalAmount: number
}

export interface RentalExtension {
  id: string
  rentalId: string
  previousDueDate: string
  newDueDate: string
  amount: number | null
  reason: string | null
  createdAt: string
}

export interface PaymentRecord {
  id: string
  outletId: string
  rentalId: string | null
  type: PaymentType
  method: PaymentMethod
  amount: number
  note: string | null
  createdAt: string
  recordedBy: { id: string; name: string }
}

export interface Rental {
  id: string
  rentalNumber: string
  outletId: string
  customerId: string
  customer: Pick<Customer, 'id' | 'name' | 'phone'>
  status: RentalStatus
  paymentPlan: PaymentPlan
  startDate: string
  dueDate: string
  returnedAt: string | null
  depositAmount: number
  depositCollected: boolean
  depositRefunded: boolean
  notes: string | null
  items: RentalItemDetail[]
  totalRentalAmount: number
  rentalPaid?: number
  rentalDue?: number
  depositDue?: number
  amountDueOnPickup?: number
  canPickup?: boolean
  needsPickupPayment?: boolean
  extensions: RentalExtension[]
  payments: PaymentRecord[]
  daysOverdue: number
  createdAt: string
  updatedAt: string
}

export interface RentalSummary {
  id: string
  rentalNumber: string
  customerId: string
  customerName: string
  status: RentalStatus
  paymentPlan?: PaymentPlan
  startDate: string
  dueDate: string
  itemsCount: number
  depositAmount: number
  totalRentalAmount: number
  daysOverdue: number
  createdAt: string
}

export interface DashboardStats {
  totalActiveRentals: number
  overdueRentals: number
  bookedRentals: number
  pickupsToday: number
  dueTodayRentals: number
  todayIncome: number
  overdueList: Array<{
    rentalId: string
    rentalNumber: string
    customerName: string
    customerPhone: string
    daysOverdue: number
    itemNames: string[]
    dueDate: string
  }>
  pickupsList: Array<{
    rentalId: string
    rentalNumber: string
    customerName: string
    customerPhone: string
    itemNames: string[]
    startDate: string
  }>
}

export interface PaymentSummary {
  todayTotal: number
  weekTotal: number
  monthTotal: number
  todayByType: Record<string, number>
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
}

export interface CreateRentalDto {
  customerId: string
  startDate: string
  dueDate: string
  depositAmount: number
  paymentMethod: PaymentMethod
  paymentPlan: PaymentPlan
  notes?: string
  autoPickup?: boolean
  items: Array<{ ornamentId: string; ratePerDay: number }>
}

export interface RescheduleRentalDto {
  startDate: string
  dueDate: string
  totalRentalAmount?: number
}

export interface CreateCustomerDto {
  name: string
  phone: string
  address?: string
  idProofType?: string
  idProofNumber?: string
}

export interface CreateOrnamentDto {
  name: string
  category: string
  weightGrams?: number
  baseRatePerDay: number
  description?: string
}

export interface WizardItem {
  ornamentId: string
  ornament: Ornament
  ratePerDay: number
}

export const PAYMENT_PLAN_LABELS: Record<PaymentPlan, string> = {
  HALF_ADVANCE: '50% rent now, rest + deposit on pickup',
  FULL_RENT_DEFER_DEPOSIT: 'Full rent now, deposit on pickup',
  FULL_UPFRONT: 'Full rent + deposit now',
}
