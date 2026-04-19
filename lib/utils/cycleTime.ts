import type { OdooCycleSummary } from '@/lib/types/ciclo'

/**
 * Calcula o atraso de um ciclo: tempo ultrapassado além da duração prevista.
 * Base = start_date + duration_planned (min). Fim = end_date ou agora (se em andamento).
 * Retorna string legível ou '' quando não há dados suficientes.
 *
 * Aceita tanto OdooCycleSummary quanto OdooCycle (que estende summary).
 */
export function formatOverdue(cycle: OdooCycleSummary): string {
  if (!cycle.start_date || !cycle.duration_planned) return ''
  const start = parseDate(cycle.start_date)
  if (start === null) return ''

  const deadline = start + cycle.duration_planned * 60 * 1000
  const end = cycle.end_date ? parseDate(cycle.end_date) : Date.now()
  if (end === null) return ''

  const overdueMs = end - deadline
  if (overdueMs <= 0) return ''
  return humanizeDuration(overdueMs)
}

function parseDate(iso: string | false | null | undefined): number | null {
  if (!iso || typeof iso !== 'string') return null
  const d = new Date(iso.replace(' ', 'T') + 'Z').getTime()
  return isNaN(d) ? null : d
}

export function humanizeDuration(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000)
  if (totalMinutes < 1) return '<1min'

  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  const parts: string[] = []
  if (days > 0) parts.push(`${days}d`)
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0 && days === 0) parts.push(`${minutes}min`)

  return parts.join(' ') || '0min'
}
