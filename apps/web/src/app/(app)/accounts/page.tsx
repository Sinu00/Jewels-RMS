'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown, Receipt } from 'lucide-react'
import { api } from '@/lib/api'
import { keys } from '@/lib/queryKeys'
import { formatINR, formatDate } from '@/lib/formatters'
import { RupeeAmount } from '@/components/shared/RupeeAmount'
import { SkeletonList } from '@/components/shared/Skeleton'
import { EmptyState } from '@/components/shared/EmptyState'
import { AccountsExportButton } from '@/components/shared/AccountsExportButton'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'

type Tab = 'income' | 'deposits'

export default function AccountsPage() {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>('income')
  const [method, setMethod] = useState('')
  const [from, setFrom] = useState(() => searchParams.get('from') ?? '')
  const [to, setTo] = useState(() => searchParams.get('to') ?? '')

  const incomeFilters = { incomeOnly: true, method: method || undefined, from: from || undefined, to: to || undefined }
  const depositFilters = { method: method || undefined, from: from || undefined, to: to || undefined }

  const { data: incomeData, isLoading: incomeLoading } = useQuery({
    queryKey: keys.payments(incomeFilters),
    queryFn: async () => {
      const params = new URLSearchParams({ incomeOnly: 'true', limit: '100' })
      if (method) params.set('method', method)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      return (await api.get(`/payments?${params}`)).data
    },
  })

  const { data: depositData, isLoading: depositLoading } = useQuery({
    queryKey: keys.payments(depositFilters),
    queryFn: async () => {
      const params = new URLSearchParams({ limit: '200' })
      if (method) params.set('method', method)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      return (await api.get(`/payments?${params}`)).data
    },
    enabled: tab === 'deposits',
  })

  const isLoading = tab === 'income' ? incomeLoading : depositLoading

  const incomeSummary = incomeData?.summary
  const incomePayments: any[] = incomeData?.data ?? []

  const now = new Date()
  const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const incomeWeekTotal = incomePayments
    .filter((p: any) => new Date(p.createdAt) >= startOfWeek)
    .reduce((s: number, p: any) => s + Number(p.amount), 0)
  const incomeMonthTotal = incomePayments
    .filter((p: any) => new Date(p.createdAt) >= startOfMonth)
    .reduce((s: number, p: any) => s + Number(p.amount), 0)

  const allDepositPayments: any[] = (depositData?.data ?? []).filter(
    (p: any) => p.type === 'DEPOSIT' || p.type === 'DEPOSIT_REFUND'
  )
  const totalCollected = allDepositPayments.filter((p) => p.type === 'DEPOSIT').reduce((s: number, p: any) => s + Number(p.amount), 0)
  const totalRefunded = allDepositPayments.filter((p) => p.type === 'DEPOSIT_REFUND').reduce((s: number, p: any) => s + Number(p.amount), 0)
  const netDeposit = totalCollected - totalRefunded

  return (
    <div>
      <PageHeader
        title="Accounts"
        action={<AccountsExportButton />}
      />

      {/* Tab bar */}
      <div className="px-5 md:px-6 mb-5">
        <div className="inline-flex bg-surface border border-border rounded-xl p-1 gap-1">
          {(['income', 'deposits'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                tab === t ? 'bg-ink text-white' : 'text-muted hover:text-ink'
              }`}
            >
              {t === 'income' ? 'Income' : 'Deposits'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      {tab === 'income' ? (
        <div className="px-5 md:px-6 max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {[
            {
              label: 'Today',
              value:
                (incomeSummary?.todayByType?.RENTAL ?? 0) +
                (incomeSummary?.todayByType?.RENTAL_ADVANCE ?? 0) +
                (incomeSummary?.todayByType?.RENTAL_BALANCE ?? 0),
            },
            { label: 'This Week', value: incomeWeekTotal },
            { label: 'This Month', value: incomeMonthTotal },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted">{label}</p>
                <RupeeAmount amount={value} size="md" className="block font-semibold" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="px-5 md:px-6 max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Collected', value: totalCollected },
            { label: 'Refunded', value: totalRefunded },
            { label: 'Net Held', value: netDeposit },
          ].map(({ label, value }) => (
            <Card key={label}>
              <CardContent className="p-3 text-center">
                <p className="text-xs text-muted">{label}</p>
                <RupeeAmount amount={value} size="md" className="block font-semibold" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Filters — all 3 in one row */}
      <div className="px-5 md:px-6 mb-5 flex flex-col sm:flex-row gap-2 max-w-6xl mx-auto">
        <Select value={method} onChange={(e) => setMethod(e.target.value)} className="h-9 text-xs flex-1">
          <option value="">All methods</option>
          <option value="CASH">Cash</option>
          <option value="UPI">UPI</option>
          <option value="BANK_TRANSFER">Bank</option>
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9 text-xs flex-1 min-w-0" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9 text-xs flex-1 min-w-0" />
      </div>

      {isLoading ? (
        <SkeletonList rows={6} />
      ) : tab === 'income' ? (
        <div className="px-5 md:px-6 max-w-6xl mx-auto">
          {incomePayments.length === 0 && (
            <EmptyState icon={Receipt} title="No income records found" description="Try adjusting the filters above." />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {incomePayments.map((p: any) => (
            <div key={p.id} className="bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center justify-between text-sm">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                  <span className="font-semibold capitalize">{p.type.replace(/_/g, ' ').toLowerCase()}</span>
                </div>
                <p className="text-xs text-muted mt-1">
                  {p.method.replace(/_/g, ' ')} · {p.recordedBy.name}
                  {p.rentalNumber && (
                    <> · <Link href={`/rentals/${p.rentalId}`} className="text-ink font-medium hover:underline">{p.rentalNumber}</Link></>
                  )}
                </p>
                <p className="text-xs text-muted mt-0.5">{formatDate(p.createdAt)}</p>
              </div>
              <span className="font-display font-semibold text-base shrink-0 ml-4 text-green-700">
                +{formatINR(p.amount)}
              </span>
            </div>
          ))}
          </div>
        </div>
      ) : (
        <div className="px-5 md:px-6 max-w-6xl mx-auto">
          {allDepositPayments.length === 0 && (
            <EmptyState icon={Receipt} title="No deposit records found" description="Try adjusting the filters above." />
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {allDepositPayments.map((p: any) => {
            const isRefund = p.type === 'DEPOSIT_REFUND'
            return (
              <div key={p.id} className="bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center justify-between text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    {isRefund
                      ? <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                      : <TrendingUp className="h-3.5 w-3.5 text-blue-600" />}
                    <span className="font-semibold">{isRefund ? 'Deposit Refund' : 'Deposit Collected'}</span>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    {p.method.replace(/_/g, ' ')} · {p.recordedBy.name}
                    {p.rentalNumber && (
                      <> · <Link href={`/rentals/${p.rentalId}`} className="text-ink font-medium hover:underline">{p.rentalNumber}</Link></>
                    )}
                  </p>
                  <p className="text-xs text-muted mt-0.5">{formatDate(p.createdAt)}</p>
                </div>
                <span className={`font-display font-semibold text-base shrink-0 ml-4 ${isRefund ? 'text-red-600' : 'text-blue-700'}`}>
                  {isRefund ? '−' : '+'}{formatINR(p.amount)}
                </span>
              </div>
            )
          })}
          </div>
        </div>
      )}
    </div>
  )
}
