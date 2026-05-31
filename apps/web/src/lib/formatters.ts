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

/** Strip everything except digits, and drop a leading 91 country code if a full number was pasted. */
export function sanitizePhone(input: string): string {
  let digits = input.replace(/\D/g, '')
  if (digits.length > 10 && digits.startsWith('91')) {
    digits = digits.slice(2)
  }
  return digits.slice(0, 10)
}

/** Indian mobile numbers: 10 digits starting 6-9. */
export function isValidPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(sanitizePhone(phone))
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

export function buildBookingMessage(
  rental: {
    rentalNumber: string
    customer: { name: string }
    items: Array<{ ornament: { name: string } }>
    startDate: string | Date
    dueDate: string | Date
    totalRentalAmount: number
    depositAmount: number
    amountDueOnPickup?: number
  },
  outletName: string
): string {
  const items = rental.items.map((i) => `• ${i.ornament.name}`).join('\n')
  const dueOnPickup = rental.amountDueOnPickup ?? rental.depositAmount
  return `*${outletName}*
Booking Confirmation

Booking No: ${rental.rentalNumber}
Dear ${rental.customer.name},

Items Reserved:
${items}

Pickup: ${formatDate(rental.startDate)}
Return: ${formatDate(rental.dueDate)}
Rental Amount: ${formatINR(rental.totalRentalAmount)}
Security Deposit: ${formatINR(rental.depositAmount)}
${dueOnPickup > 0 ? `Due on pickup: ${formatINR(dueOnPickup)}` : ''}

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
