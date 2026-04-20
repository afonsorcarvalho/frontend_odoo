import type {
  CyclePhase,
  CyclePhaseInfo,
  OdooCycle,
  OdooCycleSummary,
} from '@/lib/types/ciclo'

function parseDate(iso: string | false | null | undefined): number | null {
  if (!iso || typeof iso !== 'string') return null
  const d = new Date(iso.replace(' ', 'T') + 'Z').getTime()
  return isNaN(d) ? null : d
}

function titleCase(input: string): string {
  return input
    .replace(/[_-]+/g, ' ')
    .toLowerCase()
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ')
}

function normalizeKey(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '')
}

export function parsePhasesPlanned(
  raw: string | false | null | undefined
): CyclePhase[] {
  if (!raw || typeof raw !== 'string') return []
  const trimmed = raw.trim()
  if (!trimmed) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(trimmed)
  } catch {
    try {
      parsed = JSON.parse(trimmed.replace(/'/g, '"'))
    } catch {
      return []
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return []

  const out: CyclePhase[] = []
  for (const [name, value] of Object.entries(parsed as Record<string, unknown>)) {
    const min = typeof value === 'number' ? value : Number(value)
    if (!isFinite(min) || min <= 0) continue
    out.push({ name, label: titleCase(name), plannedMin: min })
  }
  return out
}

function parseDurationToMinutes(value: unknown): number | null {
  if (typeof value === 'number' && isFinite(value)) return value
  if (typeof value !== 'string') return null
  const s = value.trim()
  if (!s) return null
  const parts = s.split(':').map((x) => Number(x))
  if (parts.some((p) => !isFinite(p))) return null
  if (parts.length === 2) return parts[0] + parts[1] / 60
  if (parts.length === 3) return parts[0] * 60 + parts[1] + parts[2] / 60
  if (parts.length === 1) return parts[0]
  return null
}

export function parseStatisticsData(raw: unknown): Map<string, number> {
  const out = new Map<string, number>()
  if (!raw) return out

  const entries: Array<[string, unknown]> = []
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (Array.isArray(item) && item.length >= 2 && typeof item[0] === 'string') {
        entries.push([item[0], item[1]])
      }
    }
  } else if (typeof raw === 'object') {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      entries.push([k, v])
    }
  }

  for (const [name, value] of entries) {
    if (!value || typeof value !== 'object') continue
    const dur = (value as Record<string, unknown>).Duration
      ?? (value as Record<string, unknown>).duration
    const min = parseDurationToMinutes(dur)
    if (min !== null && min > 0) out.set(normalizeKey(name), min)
  }
  return out
}

interface BuildPhaseInfoArgs {
  cycle: OdooCycle | OdooCycleSummary
  phasesPlannedRaw?: string | false | null
  statisticsRaw?: unknown
  now: number
}

export function buildPhaseInfo({
  cycle,
  phasesPlannedRaw,
  statisticsRaw,
  now,
}: BuildPhaseInfoArgs): CyclePhaseInfo | null {
  const phases = parsePhasesPlanned(phasesPlannedRaw)
  if (phases.length === 0) return null

  const stats = parseStatisticsData(statisticsRaw)
  if (stats.size > 0) {
    for (const phase of phases) {
      const real = stats.get(normalizeKey(phase.name))
      if (real !== undefined) phase.actualMin = real
    }
  }

  const totalPlannedMin = phases.reduce((sum, p) => sum + p.plannedMin, 0)
  const start = parseDate(cycle.start_date)
  const elapsedMs = start !== null ? Math.max(0, now - start) : 0

  const state = cycle.state
  const finishedStates: Array<typeof state> = ['concluido', 'cancelado', 'abortado', 'erro']
  const finished = finishedStates.includes(state)

  let currentPhaseIndex: number | null = null
  if (state === 'em_andamento' && start !== null && totalPlannedMin > 0) {
    const elapsedMin = elapsedMs / 60000
    let acc = 0
    for (let i = 0; i < phases.length; i++) {
      acc += phases[i].plannedMin
      if (elapsedMin <= acc) {
        currentPhaseIndex = i
        break
      }
    }
    if (currentPhaseIndex === null) currentPhaseIndex = phases.length - 1
  } else if (state === 'concluido') {
    currentPhaseIndex = phases.length
  }

  return {
    phases,
    totalPlannedMin,
    currentPhaseIndex,
    elapsedMs,
    finished,
  }
}

export function formatHms(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(h)}:${pad(m)}:${pad(s)}`
}
