'use client'

import { NeonBadge } from '@/components/ui/NeonBadge'
import { OS_STATE_LABEL, type OsState } from '@/lib/types/os'

type NeonColor = 'blue' | 'purple' | 'pink' | 'green' | 'orange'

const STATE_COLOR: Record<OsState, NeonColor> = {
  draft:              'purple',
  under_budget:       'orange',
  pause_budget:       'purple',
  wait_authorization: 'orange',
  wait_parts:         'orange',
  execution_ready:    'blue',
  under_repair:       'blue',
  pause_repair:       'purple',
  reproved:           'pink',
  done:               'green',
  cancel:             'pink',
}

export function OsStatusBadge({ state }: { state: OsState | false }) {
  if (!state) return <NeonBadge color="blue">—</NeonBadge>
  return (
    <NeonBadge color={STATE_COLOR[state]} dot>
      {OS_STATE_LABEL[state]}
    </NeonBadge>
  )
}
