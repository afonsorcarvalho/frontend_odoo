'use client'

import { useEffect, useState } from 'react'
import { clsx } from 'clsx'
import type { OdooCycleSummary } from '@/lib/types/ciclo'
import { computeCycleProgress } from '@/lib/utils/cycleTime'

function parseStart(iso: string): number | null {
  const d = new Date(iso.replace(' ', 'T') + 'Z').getTime()
  return isNaN(d) ? null : d
}

function formatRemaining(ms: number): string {
  const totalMin = Math.max(0, Math.round(ms / 60000))
  const h = Math.floor(totalMin / 60)
  const m = totalMin % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

interface CycleProgressBarProps {
  cycle: OdooCycleSummary
  className?: string
  showLabel?: boolean
}

export function CycleProgressBar({ cycle, className, showLabel = false }: CycleProgressBarProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [cycle])

  const progress = computeCycleProgress(cycle, now)
  if (progress === null) return null

  const pct = Math.max(0, Math.min(100, progress))
  const overdue = cycle.is_overdue
  const nearEnd = !overdue && pct >= 90

  let remainingMs: number | null = null
  if (cycle.start_date && cycle.duration_planned) {
    const start = parseStart(cycle.start_date)
    if (start !== null) {
      remainingMs = start + cycle.duration_planned * 60 * 1000 - now
    }
  }

  const barClass = overdue
    ? 'bg-gradient-to-r from-neon-pink/70 to-neon-pink shadow-[0_0_8px_rgba(236,72,153,0.6)]'
    : nearEnd
      ? 'bg-gradient-to-r from-neon-orange/70 to-neon-orange shadow-[0_0_8px_rgba(245,158,11,0.5)]'
      : 'bg-gradient-to-r from-neon-green/70 to-neon-green shadow-[0_0_8px_rgba(16,185,129,0.5)]'

  const labelClass = overdue
    ? 'text-neon-pink'
    : nearEnd
      ? 'text-neon-orange'
      : 'text-neon-green'

  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      <div className="flex items-center gap-2">
        <div
          className="relative h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={clsx('absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out', barClass)}
            style={{ width: `${pct}%` }}
          />
        </div>
        {showLabel && (
          <span className={clsx('text-[10px] tabular-nums font-medium', labelClass)}>
            {Math.round(pct)}%
          </span>
        )}
      </div>
      {remainingMs !== null && (
        <span className={clsx('text-[10px] tabular-nums', labelClass)}>
          {remainingMs > 0
            ? `Faltam ${formatRemaining(remainingMs)}`
            : `Atrasado há ${formatRemaining(-remainingMs)}`}
        </span>
      )}
    </div>
  )
}
