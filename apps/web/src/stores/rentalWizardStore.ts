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

export const useRentalWizardStore = create<RentalWizardState>((set, get) => ({
  ...initial,

  totalDays: () => {
    const { startDate, dueDate } = get()
    // Inclusive of both the pickup day and the return day: 16th → 17th = 2 days.
    const diff = Math.round(
      (new Date(dueDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    )
    return Math.max(1, diff + 1)
  },

  totalAmount: () => {
    const { selectedItems } = get()
    const days = get().totalDays()
    return selectedItems.reduce((sum, item) => sum + item.ratePerDay * days, 0)
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
