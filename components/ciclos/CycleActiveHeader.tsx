'use client'

import { useEffect, useMemo, useState } from 'react'
import { clsx } from 'clsx'
import type { OdooCycle, OdooCycleSummary } from '@/lib/types/ciclo'
import { buildPhaseInfo, formatHms } from '@/lib/utils/cyclePhases'
import { useCycleFeatures } from '@/lib/hooks/useCiclos'

type AnyCycle = OdooCycleSummary | OdooCycle

interface CycleActiveHeaderProps {
  cycle: AnyCycle
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

function parseDate(iso: string | false | null | undefined): number | null {
  if (!iso || typeof iso !== 'string') return null
  const d = new Date(iso.replace(' ', 'T') + 'Z').getTime()
  return isNaN(d) ? null : d
}

function formatPlanned(min: number): string {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h${m.toString().padStart(2, '0')}`
}

export function CycleActiveHeader({ cycle, size = 'md', className }: CycleActiveHeaderProps) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [cycle.id])

  const { data: featuresList } = useCycleFeatures()
  const featuresId = Array.isArray(cycle.cycle_features_id) ? cycle.cycle_features_id[0] : null
  const resolvedFeatures = useMemo(() => {
    if (!featuresId || !featuresList) return null
    return featuresList.find((f) => f.id === featuresId) ?? null
  }, [featuresList, featuresId])

  const info = useMemo(
    () =>
      buildPhaseInfo({
        cycle,
        phasesPlannedRaw: resolvedFeatures?.phases_planned,
        statisticsRaw: undefined,
        now,
      }),
    [cycle, resolvedFeatures?.phases_planned, now]
  )

  const start = parseDate(cycle.start_date)
  const elapsedMs = start !== null ? Math.max(0, now - start) : 0

  const plannedMin = info
    ? info.totalPlannedMin
    : (typeof cycle.duration_planned === 'number' && cycle.duration_planned > 0 ? cycle.duration_planned : 0)

  const plannedMs = plannedMin * 60 * 1000
  const overdue = plannedMs > 0 && elapsedMs > plannedMs
  const overtimeMs = overdue ? elapsedMs - plannedMs : 0

  const currentPhaseLabel =
    info && info.currentPhaseIndex !== null && info.currentPhaseIndex < info.phases.length
      ? info.phases[info.currentPhaseIndex].label
      : null

  const timerSize = size === 'lg' ? 'text-5xl' : size === 'sm' ? 'text-xl' : 'text-3xl'
  const labelSize = size === 'lg' ? 'text-sm' : 'text-[10px]'
  const phaseSize = size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-xs' : 'text-sm'

  return (
    <div className={clsx('flex items-end justify-between gap-4', className)}>
      <div className="min-w-0">
        <div
          className={clsx(
            'font-mono font-semibold tabular-nums leading-none tracking-tight',
            timerSize,
            overdue ? 'text-neon-pink' : 'text-neon-green'
          )}
        >
          {formatHms(elapsedMs)}
        </div>
        <div className={clsx('mt-1 font-mono text-white/40 tabular-nums', labelSize)}>
          de {plannedMin > 0 ? formatPlanned(plannedMin) : '—'} previstos
          {overdue && overtimeMs > 0 && (
            <>
              <span className="text-white/30"> · </span>
              <span className="text-neon-pink">+{formatHms(overtimeMs)} atraso</span>
            </>
          )}
        </div>
      </div>

      {currentPhaseLabel && (
        <div className="text-right min-w-0 shrink-0">
          <div className={clsx('uppercase tracking-wider text-white/40 font-medium', labelSize)}>
            Fase atual
          </div>
          <div
            className={clsx(
              'phase-label-glow font-mono font-semibold uppercase tracking-wider mt-1 truncate',
              phaseSize,
              overdue ? 'text-neon-pink' : 'text-neon-green'
            )}
            title={currentPhaseLabel}
          >
            {currentPhaseLabel}
          </div>
        </div>
      )}
    </div>
  )
}
