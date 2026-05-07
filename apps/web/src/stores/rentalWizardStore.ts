import { create } from 'zustand'
import type { Customer, Ornament, PaymentMethod, WizardItem } from '@rental/types'
import { formatDateInput } from '@/lib/formatters'

interface RentalWizardState {
  step: 1 | 2 | 3 | 4
  customer: Customer | null
  isNewCustomer: boolean
  newCustomerData: { name: string; phone: string; address: string }
  selectedItems: WizardItem[]
  startDate: string
  dueDate: string
  depositAmount: number
  depositMethod: PaymentMethod
  notes: string

  totalDays: () => number
  totalAmount: () => number

  setStep: (step: 1 | 2 | 3 | 4) => void
  setCustomer: (customer: Customer | null) => void
  setIsNewCustomer: (v: boolean) => void
  setNewCustomerData: (data: Partial<{ name: string; phone: string; address: string }>) => void
  addItem: (ornament: Ornament, ratePerDay: number) => void
  removeItem: (ornamentId: string) => void
  updateItemRate: (ornamentId: string, rate: number) => void
  setDates: (startDate: string, dueDate: string) => void
  setDeposit: (amount: number, method: PaymentMethod) => void
  setNotes: (notes: string) => void
  reset: () => void
}

const today = formatDateInput(new Date())
const tomorrow = formatDateInput(new Date(Date.now() + 86400000))

const initial = {
  step: 1 as const,
  customer: null,
  isNewCustomer: false,
  newCustomerData: { name: '', phone: '', address: '' },
  selectedItems: [] as WizardItem[],
  startDate: today,
  dueDate: tomorrow,
  depositAmount: 0,
  depositMethod: 'CASH' as PaymentMethod,
  notes: '',
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

  setStep: (step) => set({ step }),
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

  setDates: (startDate, dueDate) => set({ startDate, dueDate }),
  setDeposit: (amount, method) => set({ depositAmount: amount, depositMethod: method }),
  setNotes: (notes) => set({ notes }),
  reset: () => set({ ...initial, startDate: formatDateInput(new Date()), dueDate: formatDateInput(new Date(Date.now() + 86400000)) }),
}))
