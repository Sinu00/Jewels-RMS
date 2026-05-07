export const keys = {
  ornaments: (filters?: object) => ['ornaments', filters] as const,
  ornament: (id: string) => ['ornaments', id] as const,
  ornamentCategories: () => ['ornaments', 'categories'] as const,
  customers: (filters?: object) => ['customers', filters] as const,
  customer: (id: string) => ['customers', id] as const,
  customerRentals: (id: string) => ['customers', id, 'rentals'] as const,
  rentals: (filters?: object) => ['rentals', filters] as const,
  rental: (id: string) => ['rentals', id] as const,
  payments: (filters?: object) => ['payments', filters] as const,
  dashboard: () => ['dashboard'] as const,
  settings: () => ['settings'] as const,
  staff: () => ['staff'] as const,
}
