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
  setTotalAmount: (amount: number) => void
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
    // Round each line on its own, then sum — so the total always matches the
    // per-item subtotals shown in the list (see lineSubtotal in the API).
    return selectedItems.reduce((sum, item) => sum + Math.round(item.ratePerDay * days), 0)
  },

  setStep: (step) => set({ step }),

  // Let staff type the final rental total; back-solve per-item day rates so the
  // agreed total is split across items (proportional to their current rates)
  // instead of the client dividing by hand.
  setTotalAmount: (amount) =>
    set((s) => {
      const days = get().totalDays()
      const items = s.selectedItems
      if (items.length === 0 || days <= 0) return s
      const target = Math.max(0, Math.round(amount))

      // Weight each item by its current subtotal so existing discounts are kept.
      const weights = items.map((i) => Math.max(0, i.ratePerDay) * days)
      const weightSum = weights.reduce((a, b) => a + b, 0)
      const ideal =
        weightSum > 0
          ? weights.map((w) => (target * w) / weightSum)
          : items.map(() => target / items.length)

      // Largest-remainder rounding: whole-rupee subtotals that sum to exactly `target`.
      const subtotals = ideal.map((v) => Math.floor(v))
      let remainder = target - subtotals.reduce((a, b) => a + b, 0)
      const byFrac = ideal
        .map((v, idx) => ({ idx, frac: v - Math.floor(v) }))
        .sort((a, b) => b.frac - a.frac)
      for (let k = 0; k < byFrac.length && remainder > 0; k++) {
        subtotals[byFrac[k].idx] += 1
        remainder--
      }

      return {
        selectedItems: items.map((i, idx) => ({
          ...i,
          ratePerDay: Math.round((subtotals[idx] / days) * 100) / 100,
        })),
      }
    }),
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
