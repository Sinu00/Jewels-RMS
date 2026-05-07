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

const TYPE_LABELS: Record<string, string> = {
  RENTAL: 'Rental', DEPOSIT: 'Deposit', DEPOSIT_REFUND: 'Deposit Refund', OTHER: 'Other',
}

export default function AccountsPage() {
  const [type, setType] = useState('')
  const [method, setMethod] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const filters = { type: type || undefined, method: method || undefined, from: from || undefined, to: to || undefined }
  const { data, isLoading } = useQuery({
    queryKey: keys.payments(filters),
    queryFn: async () => {
      const params = new URLSearchParams()
      if (type) params.set('type', type)
      if (method) params.set('method', method)
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      params.set('limit', '100')
      return (await api.get(`/payments?${params}`)).data
    },
  })

  const summary = data?.summary

  return (
    <div>
      <PageHeader title="Accounts" />

      {/* Summary cards */}
      <div className="px-4 md:px-6 grid grid-cols-3 gap-3 mb-4">
        {[
          { label: "Today", value: summary?.todayTotal ?? 0 },
          { label: "This Week", value: summary?.weekTotal ?? 0 },
          { label: "This Month", value: summary?.monthTotal ?? 0 },
        ].map(({ label, value }) => (
          <Card key={label}>
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted">{label}</p>
              <RupeeAmount amount={value} size="md" className="block font-semibold" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="px-4 md:px-6 flex gap-2 flex-wrap mb-4">
        <Select value={type} onChange={(e) => setType(e.target.value)} className="w-36">
          <option value="">All types</option>
          <option value="RENTAL">Rental</option>
          <option value="DEPOSIT">Deposit</option>
          <option value="DEPOSIT_REFUND">Deposit Refund</option>
          <option value="OTHER">Other</option>
        </Select>
        <Select value={method} onChange={(e) => setMethod(e.target.value)} className="w-36">
          <option value="">All methods</option>
          <option value="CASH">Cash</option>
          <option value="UPI">UPI</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
        </Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-36" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-36" />
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="px-4 md:px-6 space-y-2">
          {data?.data.map((p: any) => {
            const isOut = p.type === 'DEPOSIT_REFUND'
            return (
              <div key={p.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between text-sm">
                <div>
                  <div className="flex items-center gap-2">
                    {isOut ? <TrendingDown className="h-3.5 w-3.5 text-red-500" /> : <TrendingUp className="h-3.5 w-3.5 text-green-600" />}
                    <span className="font-medium">{TYPE_LABELS[p.type] ?? p.type}</span>
                  </div>
                  <p className="text-xs text-muted mt-0.5">
                    {p.method.replace(/_/g, ' ')} · {p.recordedBy.name}
                    {p.rentalNumber && (
                      <> · <Link href={`/rentals/${p.rentalId}`} className="text-gold hover:underline">{p.rentalNumber}</Link></>
                    )}
                  </p>
                  <p className="text-xs text-muted">{formatDate(p.createdAt)}</p>
                </div>
                <span className={`font-display font-semibold text-base ${isOut ? 'text-red-600' : 'text-green-700'}`}>
                  {isOut ? '-' : '+'}{formatINR(p.amount)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
