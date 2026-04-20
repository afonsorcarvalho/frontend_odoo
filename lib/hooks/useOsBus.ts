'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { subscribeBus } from '../odoo/bus'
import { OS_KEY } from './useOs'

const EVENT_TYPE = 'engc_os.changed'

interface OsChangePayload {
  event: 'created' | 'updated'
  id: number
  name?: string
  state?: string
  write_date?: string
}

/**
 * Recebe eventos de OS em tempo real do bus.bus do Odoo (via SSE bridge no Next)
 * e invalida os caches do React Query correspondentes.
 *
 * Deve ser montado uma única vez na árvore (ex.: na página de listagem).
 */
export function useOsBus(enabled = true) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    const sub = subscribeBus((msg) => {
      if (msg.type !== EVENT_TYPE) return
      const payload = msg.payload as OsChangePayload | undefined
      if (!payload) return
      queryClient.invalidateQueries({ queryKey: [OS_KEY] })
      if (typeof payload.id === 'number') {
        queryClient.invalidateQueries({ queryKey: ['os-detail', payload.id] })
      }
    })

    return () => sub.close()
  }, [enabled, queryClient])
}
