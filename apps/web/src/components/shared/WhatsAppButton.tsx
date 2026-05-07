'use client'

import { MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WhatsAppButtonProps {
  phone: string
  message: string
  label?: string
  size?: 'sm' | 'default'
  className?: string
}

export function WhatsAppButton({ phone, message, label = 'WhatsApp', size = 'default', className }: WhatsAppButtonProps) {
  const normalized = phone.startsWith('91') ? phone : `91${phone}`
  const url = `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`

  return (
    <a href={url} target="_blank" rel="noopener noreferrer">
      <Button
        variant="outline"
        size={size}
        className={cn('border-green-600 text-green-700 hover:bg-green-50', className)}
      >
        <MessageCircle className="h-4 w-4" />
        {label}
      </Button>
    </a>
  )
}
