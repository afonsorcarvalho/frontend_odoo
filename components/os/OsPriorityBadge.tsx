'use client'

import { clsx } from 'clsx'
import { Flag } from 'lucide-react'
import { OS_PRIORITY_LABEL, type OsPriority } from '@/lib/types/os'

const COLOR: Record<OsPriority, string> = {
  '0': 'text-white/50',
  '1': 'text-neon-blue',
  '2': 'text-neon-orange',
  '3': 'text-neon-pink',
}

export function OsPriorityBadge({ priority, compact = false }: {
  priority: OsPriority | false
  compact?: boolean
}) {
  if (priority === false || priority === undefined || priority === null) {
    return compact ? null : <span className="text-xs text-white/40">—</span>
  }
  return (
    <span
      className={clsx('inline-flex items-center gap-1 text-xs font-medium', COLOR[priority])}
      title={OS_PRIORITY_LABEL[priority]}
    >
      <Flag size={11} />
      {!compact && OS_PRIORITY_LABEL[priority]}
    </span>
  )
}
