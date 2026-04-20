'use client'

import { useEffect, useMemo, useState } from 'react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'
import type { OdooCycle, OdooCycleSummary, CycleFeatures, CyclePhase } from '@/lib/types/ciclo'
import { buildPhaseInfo, formatHms } from '@/lib/utils/cyclePhases'
import { useCycleFeatures } from '@/lib/hooks/useCiclos'
import { CycleProgressBar } from './CycleProgressBar'

type AnyCycle = OdooCycleSummary | OdooCycle

interface CyclePhaseBarProps {
  cycle: AnyCycle
  cycleFeatures?: Pick<CycleFeatures, 'phases_planned'> | null
  statisticsData?: unknown
  variant: 'compact' | 'full'
  showHeader?: boolean
  className?: string
}

function getStatistics(cycle: AnyCycle, override?: unknown): unknown {
  if (override !== undefined) return override
  return (cycle as OdooCycle).cycle_statistics_data
}

export function CyclePhaseBar({
  cycle,
  cycleFeatures,
  statisticsData,
  variant,
  showHeader = true,
  className,
}: CyclePhaseBarProps) {
  const isActive = cycle.state === 'em_andamento'
  const tickMs = variant === 'full' && isActive ? 1000 : 30_000

  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), tickMs)
    return () => clearInterval(id)
  }, [tickMs, cycle.id])

  const { data: featuresList } = useCycleFeatures()
  const featuresId = Array.isArray(cycle.cycle_features_id) ? cycle.cycle_features_id[0] : null

  const resolvedFeatures = useMemo(() => {
    if (cycleFeatures) return cycleFeatures
    if (!featuresId || !featuresList) return null
    return featuresList.find((f) => f.id === featuresId) ?? null
  }, [cycleFeatures, featuresList, featuresId])

  const info = useMemo(
    () =>
      buildPhaseInfo({
        cycle,
        phasesPlannedRaw: resolvedFeatures?.phases_planned,
        statisticsRaw: getStatistics(cycle, statisticsData),
        now,
      }),
    [cycle, resolvedFeatures?.phases_planned, statisticsData, now]
  )

  if (!info) {
    if (cycle.start_date && cycle.duration_planned) {
      return <CycleProgressBar cycle={cycle} className={className} showLabel={variant === 'full'} />
    }
    return null
  }

  const { phases, totalPlannedMin, currentPhaseIndex, elapsedMs, finished } = info
  const totalMs = totalPlannedMin * 60 * 1000
  const overdueMs = isActive && elapsedMs > totalMs ? elapsedMs - totalMs : 0

  const phaseFillPct = computePhaseFillPct(phases, currentPhaseIndex, elapsedMs)

  if (variant === 'compact') {
    return (
      <div className={clsx('w-full', className)}>
        <SegmentRow
          phases={phases}
          totalPlannedMin={totalPlannedMin}
          currentIndex={currentPhaseIndex}
          phaseFillPct={phaseFillPct}
          finished={finished}
          state={cycle.state}
          dense
        />
      </div>
    )
  }

  const materialCount =
    typeof cycle.material_count === 'number' && cycle.material_count > 0
      ? cycle.material_count
      : null

  const timer = (
    <div className="flex items-center gap-2 tabular-nums">
      <motion.span
        key={Math.floor(elapsedMs / 1000)}
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className={clsx(
          'font-mono font-semibold',
          overdueMs > 0 ? 'text-neon-pink' : isActive ? 'text-neon-green' : 'text-white/70'
        )}
      >
        {formatHms(elapsedMs)}
      </motion.span>
      <span className="text-white/30">/</span>
      <span className="font-mono text-white/60">{formatHms(totalMs)}</span>
    </div>
  )

  return (
    <div className={clsx('w-full select-none', className)}>
      <div className="flex items-center justify-between gap-3 mb-2 text-sm">
        {showHeader ? (
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-semibold text-white truncate">{cycle.name}</span>
            {materialCount !== null && (
              <span className="text-white/40 truncate">· Materiais {materialCount}</span>
            )}
          </div>
        ) : (
          <span className="text-[10px] uppercase tracking-wider text-white/40">Tempo de ciclo</span>
        )}
        {timer}
      </div>

      <SegmentRow
        phases={phases}
        totalPlannedMin={totalPlannedMin}
        currentIndex={currentPhaseIndex}
        phaseFillPct={phaseFillPct}
        finished={finished}
        state={cycle.state}
      />
    </div>
  )
}

function computePhaseFillPct(
  phases: CyclePhase[],
  currentIndex: number | null,
  elapsedMs: number
): number {
  if (currentIndex === null || currentIndex < 0 || currentIndex >= phases.length) return 0
  const elapsedMin = elapsedMs / 60000
  let acc = 0
  for (let i = 0; i < currentIndex; i++) acc += phases[i].plannedMin
  const into = elapsedMin - acc
  const total = phases[currentIndex].plannedMin
  if (total <= 0) return 0
  return Math.max(0, Math.min(100, (into / total) * 100))
}

interface SegmentRowProps {
  phases: CyclePhase[]
  totalPlannedMin: number
  currentIndex: number | null
  phaseFillPct: number
  finished: boolean
  state: AnyCycle['state']
  dense?: boolean
}

function SegmentRow({
  phases,
  totalPlannedMin,
  currentIndex,
  phaseFillPct,
  finished,
  state,
  dense,
}: SegmentRowProps) {
  const aborted = state === 'cancelado' || state === 'abortado' || state === 'erro'
  const concluido = state === 'concluido'

  const segments = phases.map((phase, i) => {
    const widthPct = (phase.plannedMin / totalPlannedMin) * 100
    const isCurrent = !finished && currentIndex === i
    const isDone = finished || (currentIndex !== null && i < currentIndex)
    const isFuture = !isCurrent && !isDone
    return { phase, i, widthPct, isCurrent, isDone, isFuture }
  })

  if (dense) {
    return (
      <div
        className="flex w-full overflow-hidden rounded-lg border border-white/10 bg-dark-900/50 h-2 gap-px"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={totalPlannedMin}
        aria-valuenow={currentIndex !== null ? currentIndex + 1 : 0}
      >
        {segments.map(({ phase, i, widthPct, isCurrent, isDone, isFuture }) => {
          const baseCls = isCurrent
            ? 'phase-active-glow border border-neon-green bg-neon-green'
            : isDone
              ? clsx(
                  'border',
                  concluido
                    ? 'bg-neon-green/30 border-neon-green/40'
                    : aborted
                      ? 'bg-neon-pink/20 border-neon-pink/30'
                      : 'bg-neon-green/25 border-neon-green/30'
                )
              : 'bg-white/[0.04] border border-white/10'
          return (
            <div
              key={`${phase.name}-${i}`}
              style={{ flexBasis: `${widthPct}%` }}
              className={clsx(
                'relative min-w-0 rounded-sm overflow-hidden',
                isFuture && 'border-dashed',
                baseCls
              )}
              title={`${phase.label} · ${phase.plannedMin} min`}
            />
          )
        })}
      </div>
    )
  }

  return (
    <div
      className="w-full"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={totalPlannedMin}
      aria-valuenow={currentIndex !== null ? currentIndex + 1 : 0}
    >
      {/* Linha 1: nomes das fases */}
      <div className="flex w-full gap-1 mb-2">
        {segments.map(({ phase, i, widthPct, isCurrent, isDone }) => (
          <div
            key={`label-${phase.name}-${i}`}
            style={{ flexBasis: `${widthPct}%` }}
            className="min-w-0 px-1 text-center"
          >
            <span
              className={clsx(
                'block text-[11px] font-bold uppercase tracking-wider truncate',
                isCurrent
                  ? 'phase-label-glow text-neon-green'
                  : isDone
                    ? aborted ? 'text-neon-pink/70' : 'text-neon-green/70'
                    : 'text-white/40'
              )}
              title={phase.label}
            >
              {phase.label}
            </span>
          </div>
        ))}
      </div>

      {/* Linha 2: barra de segmentos */}
      <div className="flex w-full overflow-hidden rounded-md border border-white/10 bg-dark-900/50 h-3 gap-0.5 p-0.5">
        {segments.map(({ phase, i, widthPct, isCurrent, isDone, isFuture }) => {
          const baseCls = isCurrent
            ? 'phase-active-glow border border-neon-green bg-neon-green'
            : isDone
              ? clsx(
                  'border',
                  concluido
                    ? 'bg-neon-green/30 border-neon-green/40'
                    : aborted
                      ? 'bg-neon-pink/20 border-neon-pink/30'
                      : 'bg-neon-green/25 border-neon-green/30'
                )
              : 'bg-white/[0.04] border border-white/10'
          return (
            <div
              key={`bar-${phase.name}-${i}`}
              style={{ flexBasis: `${widthPct}%` }}
              className={clsx(
                'relative min-w-0 rounded-md overflow-hidden transition-colors',
                isFuture && 'border-dashed',
                baseCls
              )}
              title={`${phase.label} · ${phase.plannedMin} min${phase.actualMin ? ` (real ${phase.actualMin.toFixed(1)} min)` : ''}`}
            >
              {isCurrent && (
                <>
                  <motion.div
                    className="phase-fill absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-200/70 via-white/40 to-emerald-100/70 pointer-events-none"
                    initial={{ width: 0 }}
                    animate={{ width: `${phaseFillPct}%` }}
                    transition={{ type: 'tween', ease: 'linear', duration: 0.6 }}
                  />
                  <div className="phase-shimmer" />
                </>
              )}
            </div>
          )
        })}
      </div>

      {/* Linha 3: tempos */}
      <div className="flex w-full gap-1 mt-2">
        {segments.map(({ phase, i, widthPct, isCurrent, isDone }) => (
          <div
            key={`time-${phase.name}-${i}`}
            style={{ flexBasis: `${widthPct}%` }}
            className="min-w-0 px-1 text-center"
          >
            <span
              className={clsx(
                'block text-base font-semibold tabular-nums truncate',
                isCurrent
                  ? 'text-neon-green'
                  : isDone
                    ? aborted ? 'text-neon-pink/70' : 'text-neon-green/70'
                    : 'text-white/50'
              )}
            >
              {phase.plannedMin} min
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
