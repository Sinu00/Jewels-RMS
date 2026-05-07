const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

export function formatINR(amount: number): string {
  return inrFormatter.format(amount)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateInput(date: string | Date): string {
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

export function whatsappUrl(phone: string, message: string): string {
  // Ensure 91 prefix
  const normalized = phone.startsWith('91') ? phone : `91${phone}`
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`
}

export function buildBillMessage(rental: {
  rentalNumber: string
  customer: { name: string }
  items: Array<{ ornament: { name: string } }>
  startDate: string | Date
  dueDate: string | Date
  totalRentalAmount: number
  depositAmount: number
}, outletName: string): string {
  const items = rental.items.map((i) => `• ${i.ornament.name}`).join('\n')
  return `*${outletName}*
Rental Bill

Rental No: ${rental.rentalNumber}
Dear ${rental.customer.name},

Items Rented:
${items}

Rental Period: ${formatDate(rental.startDate)} to ${formatDate(rental.dueDate)}
Rental Amount: ${formatINR(rental.totalRentalAmount)}
Security Deposit: ${formatINR(rental.depositAmount)}

Please return items on or before ${formatDate(rental.dueDate)}.

Thank you for choosing us! 🙏`
}

export function buildReminderMessage(rental: {
  rentalNumber: string
  customer: { name: string }
  items: Array<{ ornament: { name: string } }>
  dueDate: string | Date
  daysOverdue: number
}): string {
  const items = rental.items.map((i) => i.ornament.name).join(', ')
  const isOverdue = rental.daysOverdue > 0
  return isOverdue
    ? `Dear ${rental.customer.name}, your rental *${rental.rentalNumber}* (${items}) was due on ${formatDate(rental.dueDate)} and is now *${rental.daysOverdue} day(s) overdue*. Please return the items or contact us to extend. Thank you.`
    : `Dear ${rental.customer.name}, your rental *${rental.rentalNumber}* (${items}) is due on *${formatDate(rental.dueDate)}*. Please return the items on time or contact us if you need an extension. Thank you.`
}
