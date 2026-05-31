import { create } from 'zustand'
import type { Customer, Ornament, PaymentMethod, PaymentPlan, WizardItem } from '@rental/types'
import { formatDateInput } from '@/lib/formatters'

type WizardStep = 1 | 2 | 3 | 4 | 5

interface RentalWizardState {
  step: WizardStep
  startDate: string
  dueDate: string
  selectedItems: WizardItem[]
  customer: Customer | null
  isNewCustomer: boolean
  newCustomerData: { name: string; phone: string; address: string }
  depositAmount: number
  paymentPlan: PaymentPlan
  paymentMethod: PaymentMethod
  notes: string

  totalDays: () => number
  totalAmount: () => number
  bookingPaymentToday: () => number

  setStep: (step: WizardStep) => void
  setDates: (startDate: string, dueDate: string) => void
  addItem: (ornament: Ornament, ratePerDay: number) => void
  removeItem: (ornamentId: string) => void
  updateItemRate: (ornamentId: string, rate: number) => void
  setCustomer: (customer: Customer | null) => void
  setIsNewCustomer: (v: boolean) => void
  setNewCustomerData: (data: Partial<{ name: string; phone: string; address: string }>) => void
  setDeposit: (amount: number) => void
  setPaymentPlan: (plan: PaymentPlan) => void
  setPaymentMethod: (method: PaymentMethod) => void
  setNotes: (notes: string) => void
  reset: () => void
}

const today = formatDateInput(new Date())
const tomorrow = formatDateInput(new Date(Date.now() + 86400000))

const initial = {
  step: 1 as WizardStep,
  startDate: today,
  dueDate: tomorrow,
  selectedItems: [] as WizardItem[],
  customer: null,
  isNewCustomer: false,
  newCustomerData: { name: '', phone: '', address: '' },
  depositAmount: 0,
  paymentPlan: 'HALF_ADVANCE' as PaymentPlan,
  paymentMethod: 'CASH' as PaymentMethod,
  notes: '',
}

function bookingAmount(plan: PaymentPlan, total: number, deposit: number): number {
  switch (plan) {
    case 'HALF_ADVANCE':
      return Math.round(total / 2)
    case 'FULL_RENT_DEFER_DEPOSIT':
      return total
    case 'FULL_UPFRONT':
      return total + deposit
    default:
      return total
  }
}

export const useRentalWizardStore = create<RentalWizardState>((set, get) => ({
  ...initial,

  totalDays: () => {
    const { startDate, dueDate } = get()
    const diff = Math.ceil(
      (new Date(dueDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    )
    return Math.max(1, diff)
  },

  totalAmount: () => {
    const { selectedItems } = get()
    const days = get().totalDays()
    return selectedItems.reduce((sum, item) => sum + item.ratePerDay * days, 0)
  },

  bookingPaymentToday: () => {
    const { paymentPlan, depositAmount } = get()
    return bookingAmount(paymentPlan, get().totalAmount(), depositAmount)
  },

  setStep: (step) => set({ step }),
  setDates: (startDate, dueDate) => set({ startDate, dueDate, selectedItems: [] }),
  setCustomer: (customer) => set({ customer }),
  setIsNewCustomer: (v) => set({ isNewCustomer: v }),
  setNewCustomerData: (data) =>
    set((s) => ({ newCustomerData: { ...s.newCustomerData, ...data } })),

  addItem: (ornament, ratePerDay) =>
    set((s) => {
      if (s.selectedItems.find((i) => i.ornamentId === ornament.id)) return s
      return { selectedItems: [...s.selectedItems, { ornamentId: ornament.id, ornament, ratePerDay }] }
    }),

  removeItem: (ornamentId) =>
    set((s) => ({ selectedItems: s.selectedItems.filter((i) => i.ornamentId !== ornamentId) })),

  updateItemRate: (ornamentId, rate) =>
    set((s) => ({
      selectedItems: s.selectedItems.map((i) =>
        i.ornamentId === ornamentId ? { ...i, ratePerDay: rate } : i
      ),
    })),

  setDeposit: (amount) => set({ depositAmount: amount }),
  setPaymentPlan: (plan) => set({ paymentPlan: plan }),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setNotes: (notes) => set({ notes }),
  reset: () =>
    set({
      ...initial,
      startDate: formatDateInput(new Date()),
      dueDate: formatDateInput(new Date(Date.now() + 86400000)),
    }),
}))
