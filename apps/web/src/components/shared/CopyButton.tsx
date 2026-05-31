'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from '@/lib/toast'

interface CopyButtonProps {
  value: string
  label?: string
  className?: string
}

export function CopyButton({ value, label = 'Copied', className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      toast.success(`${label} to clipboard`)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Could not copy')
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="Copy to clipboard"
      className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-muted hover:text-ink hover:bg-surface transition-colors ${className ?? ''}`}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  )
}
