'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { subscribeBus } from '../odoo/bus'
import { CICLOS_KEY } from './useCiclos'

const EVENT_TYPE = 'ciclos.changed'

interface CicloChangePayload {
  event: 'created' | 'updated'
  id: number
  name?: string
  state?: string
  write_date?: string
}

/**
 * Recebe eventos de Ciclos em tempo real do bus.bus do Odoo (via SSE bridge no Next)
 * e invalida os caches do React Query correspondentes.
 *
 * Deve ser montado uma única vez na árvore (ex.: na página de listagem).
 */
export function useCiclosBus(enabled = true) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    const sub = subscribeBus('/api/ciclos/bus', (msg) => {
      if (msg.type !== EVENT_TYPE) return
      const payload = msg.payload as CicloChangePayload | undefined
      if (!payload) return
      queryClient.invalidateQueries({ queryKey: [CICLOS_KEY] })
      if (typeof payload.id === 'number') {
        queryClient.invalidateQueries({ queryKey: ['ciclo', payload.id] })
      }
    })

    return () => sub.close()
  }, [enabled, queryClient])
}
