// Client-side PDF reports (jsPDF + autotable). Loaded on demand via dynamic
// import so the libraries never ship in the initial bundle — only when a user
// actually clicks a Download button. Keeping this off the server also spares
// the small droplet any rendering load.
import { formatDate } from './formatters'

interface PdfMeta {
  outletName: string
  generatedBy?: string
}

// jsPDF's built-in Helvetica has no ₹ glyph (it renders as a stray superscript),
// so PDF amounts use plain Indian-grouped numbers and the column header carries
// the "(Rs.)" unit instead.
const inrPlain = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })
function amt(n: number): string {
  return inrPlain.format(n)
}

function stamp(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

async function newDoc(title: string, meta: PdfMeta, subtitle?: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text(meta.outletName || 'Jewels RMS', 40, 48)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.text(title, 40, 68)

  doc.setFontSize(9)
  doc.setTextColor(120)
  let y = 84
  if (subtitle) {
    doc.text(subtitle, 40, y)
    y += 13
  }
  doc.text(
    `Generated ${formatDate(new Date())}${meta.generatedBy ? ' · by ' + meta.generatedBy : ''}`,
    40,
    y
  )
  doc.setTextColor(0)
  return { doc, startY: y + 14 }
}

function addFooters(doc: any) {
  const pages = doc.getNumberOfPages()
  const w = doc.internal.pageSize.getWidth()
  const h = doc.internal.pageSize.getHeight()
  doc.setFontSize(8)
  doc.setTextColor(150)
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i)
    doc.text(`Page ${i} of ${pages}`, w - 40, h - 20, { align: 'right' })
  }
  doc.setTextColor(0)
}

const HEAD_FILL: [number, number, number] = [26, 26, 26]

// ---------- Inventory ----------

export interface InventoryRow {
  itemCode: string
  name: string
  category: string
  weightGrams: number | null
  baseRatePerDay: number
  status?: string
  statusDetail?: string | null
}

export async function downloadInventoryPdf(params: {
  rows: InventoryRow[]
  mode: 'full' | 'available'
  meta: PdfMeta
  range?: { startDate: string; dueDate: string } | null
}) {
  const { rows, mode, meta, range } = params
  const title = mode === 'available' ? 'Available Inventory Report' : 'Full Inventory Report'
  const subtitle =
    mode === 'available' && range
      ? `Available ${formatDate(range.startDate)} – ${formatDate(range.dueDate)}  ·  ${rows.length} item(s)`
      : `${rows.length} item(s)`

  const { doc, startY } = await newDoc(title, meta, subtitle)
  const { default: autoTable } = await import('jspdf-autotable')

  const includeStatus = mode === 'full'
  const head = includeStatus
    ? [['#', 'Item Code', 'Name', 'Category', 'Weight (g)', 'Rate/Day (Rs.)', 'Status']]
    : [['#', 'Item Code', 'Name', 'Category', 'Weight (g)', 'Rate/Day (Rs.)']]

  const body = rows.map((r, i) => {
    const cols = [
      String(i + 1),
      r.itemCode,
      r.name,
      r.category,
      r.weightGrams != null ? String(r.weightGrams) : '—',
      amt(r.baseRatePerDay),
    ]
    if (includeStatus) {
      let detail = ''
      if (r.statusDetail) {
        detail =
          r.status === 'Booked'
            ? ` (from ${formatDate(r.statusDetail)})`
            : ` (due ${formatDate(r.statusDetail)})`
      }
      cols.push(`${r.status ?? 'Available'}${detail}`)
    }
    return cols
  })

  autoTable(doc, {
    head,
    body,
    startY,
    styles: { fontSize: 8, cellPadding: 4, overflow: 'linebreak' },
    headStyles: { fillColor: HEAD_FILL, textColor: 255 },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: { 0: { cellWidth: 22 }, 5: { halign: 'right' } },
  })

  addFooters(doc)
  doc.save(`${mode === 'available' ? 'available-inventory' : 'inventory'}-${stamp()}.pdf`)
}

// ---------- Accounts (rental income only) ----------

export interface PaymentRow {
  createdAt: string
  type: string
  method: string
  rentalNumber: string | null
  amount: number
  recordedBy: { name: string }
}

export async function downloadAccountsPdf(params: {
  rows: PaymentRow[]
  meta: PdfMeta
  periodLabel: string
}) {
  const { rows, meta, periodLabel } = params
  const total = rows.reduce((s, p) => s + p.amount, 0)

  const subtitle = `${periodLabel}  ·  ${rows.length} record(s)  ·  Total Rs ${amt(total)}`
  const { doc, startY } = await newDoc('Rental Income Report', meta, subtitle)
  const { default: autoTable } = await import('jspdf-autotable')

  const head = [['Date', 'Rental', 'Method', 'Recorded By', 'Amount (Rs.)']]
  const body = rows.map((p) => [
    formatDate(p.createdAt),
    p.rentalNumber ?? '—',
    titleCase(p.method),
    p.recordedBy.name,
    amt(p.amount),
  ])

  autoTable(doc, {
    head,
    body,
    startY,
    styles: { fontSize: 9, cellPadding: 5, overflow: 'linebreak' },
    headStyles: { fillColor: HEAD_FILL, textColor: 255 },
    alternateRowStyles: { fillColor: [248, 248, 248] },
    columnStyles: { 4: { halign: 'right' } },
    foot: [['', '', '', 'Total', `Rs ${amt(total)}`]],
    footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
  })

  addFooters(doc)
  doc.save(`rental-income-${stamp()}.pdf`)
}
