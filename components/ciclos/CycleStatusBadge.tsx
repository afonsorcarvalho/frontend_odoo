'use client'

import { NeonBadge } from '@/components/ui/NeonBadge'
import { CYCLE_STATE_LABEL, type CycleState } from '@/lib/types/ciclo'

type NeonColor = 'blue' | 'purple' | 'pink' | 'green' | 'orange'

const STATE_COLOR: Record<CycleState, NeonColor> = {
  em_andamento: 'blue',
  concluido:    'green',
  cancelado:    'pink',
  erro:         'pink',
  abortado:     'pink',
  aguardando:   'orange',
  pausado:      'purple',
}

export function CycleStatusBadge({ state }: { state: CycleState | false }) {
  if (!state) {
    return <NeonBadge color="blue">—</NeonBadge>
  }
  return (
    <NeonBadge color={STATE_COLOR[state]} dot>
      {CYCLE_STATE_LABEL[state]}
    </NeonBadge>
  )
}
