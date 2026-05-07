'use client'

import { NeonBadge } from '@/components/ui/NeonBadge'
import { OS_STATE_LABEL, type OsState } from '@/lib/types/os'

type NeonColor = 'blue' | 'purple' | 'pink' | 'green' | 'orange' | 'gray'

const STATE_COLOR: Record<OsState, NeonColor> = {
  draft:              'purple',
  under_budget:       'orange',
  pause_budget:       'purple',
  wait_authorization: 'orange',
  wait_parts:         'orange',
  execution_ready:    'orange',
  under_repair:       'green',
  pause_repair:       'purple',
  reproved:           'gray',
  done:               'gray',
  cancel:             'gray',
}

export function OsStatusBadge({ state }: { state: OsState | false }) {
  if (!state) return <NeonBadge color="blue">—</NeonBadge>
  return (
    <NeonBadge color={STATE_COLOR[state]} dot>
      {OS_STATE_LABEL[state]}
    </NeonBadge>
  )
}
