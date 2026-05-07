'use client'

import {
  Wrench, ShieldCheck, Activity, ClipboardCheck,
  Settings, BookOpen, SlidersHorizontal, ArrowLeftRight,
  type LucideIcon,
} from 'lucide-react'
import { clsx } from 'clsx'
import {
  MAINTENANCE_TYPE_LABEL,
  MAINTENANCE_TYPE_ICON_COLOR,
  MAINTENANCE_TYPE_ICON_NAME,
  type MaintenanceType,
} from '@/lib/types/os'

const ICON_MAP: Record<string, LucideIcon> = {
  Wrench, ShieldCheck, Activity, ClipboardCheck,
  Settings, BookOpen, SlidersHorizontal, ArrowLeftRight,
}

interface Props {
  type: MaintenanceType | false
  showLabel?: boolean
  size?: number
}

export function OsMaintenanceTypeBadge({ type, showLabel = true, size = 10 }: Props) {
  if (!type) return null
  const Icon = ICON_MAP[MAINTENANCE_TYPE_ICON_NAME[type]]
  const colorCls = MAINTENANCE_TYPE_ICON_COLOR[type]
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5',
      'px-2 py-0.5 rounded-lg text-[11px] font-medium',
      'bg-white/[0.04] border border-white/10 text-white/55',
    )}>
      {Icon && <Icon size={size} className={clsx('flex-shrink-0', colorCls)} />}
      {showLabel && MAINTENANCE_TYPE_LABEL[type]}
    </span>
  )
}
