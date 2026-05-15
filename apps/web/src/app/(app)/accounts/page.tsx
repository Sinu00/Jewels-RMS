'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { api } from '@/lib/api'
import { keys } from '@/lib/queryKeys'
import { formatINR, formatDate } from '@/lib/formatters'
import { RupeeAmount } from '@/components/shared/RupeeAmount'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/layout/PageHeader'

type Tab = 'income' | 'deposits'

export default function AccountsPage() {
  const [tab, setTab] = useState<Tab>('income')
  const [method, setMethod] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const incomeFilters = { type: 'RENTAL', method: method || undefined, from: from || undefined, to: to || undefined }
  const depositFilters = { method: method || undefined, from: from || undefined, to: to || undefined }

  const { data: incomeData, isLoading: incomeLoading } = useQuery({
    queryKey: keys.payments(incomeFilters),
    queryFn: async () => {
      const params = new URLSearchParams({ type: 'RENTAL', limit: '100' })
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
      <PageHeader title="Accounts" />

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
        <div className="px-5 md:px-6 grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'Today', value: incomeSummary?.todayByType?.RENTAL ?? 0 },
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
        <div className="px-5 md:px-6 grid grid-cols-3 gap-3 mb-5">
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

      {/* Filters */}
      <div className="px-5 md:px-6 mb-5 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Select value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="">All methods</option>
            <option value="CASH">Cash</option>
            <option value="UPI">UPI</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </Select>
          <div />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} placeholder="From date" />
          <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} placeholder="To date" />
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : tab === 'income' ? (
        <div className="px-5 md:px-6 space-y-2">
          {incomePayments.length === 0 && (
            <p className="text-sm text-muted text-center py-8">No income records found</p>
          )}
          {incomePayments.map((p: any) => (
            <div key={p.id} className="bg-card border border-border rounded-2xl px-4 py-3.5 flex items-center justify-between text-sm">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                  <span className="font-semibold">Rental Income</span>
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
      ) : (
        <div className="px-5 md:px-6 space-y-2">
          {allDepositPayments.length === 0 && (
            <p className="text-sm text-muted text-center py-8">No deposit records found</p>
          )}
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
      )}
    </div>
  )
}
