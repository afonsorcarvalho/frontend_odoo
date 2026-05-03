'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { subscribeBus } from '../odoo/bus'
import { CICLOS_KEY } from './useCiclos'

const EVENT_TYPE = 'ciclos.changed'
const LIST_INVALIDATE_DEBOUNCE_MS = 1500

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
 *
 * Invalidação da LISTA é debounced — ciclos ativos emitem write_date a cada
 * segundo (estatísticas de fase) e geram rajadas de eventos; agrupamos em
 * janela para evitar N search_read seguidos.
 * Detalhe é invalidado imediatamente (só quando o ciclo específico muda).
 */
export function useCiclosBus(enabled = true) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    let listTimer: ReturnType<typeof setTimeout> | null = null
    const scheduleListInvalidate = () => {
      if (listTimer) return
      listTimer = setTimeout(() => {
        listTimer = null
        queryClient.invalidateQueries({ queryKey: [CICLOS_KEY] })
      }, LIST_INVALIDATE_DEBOUNCE_MS)
    }

    const sub = subscribeBus('/api/ciclos/bus', (msg) => {
      if (msg.type !== EVENT_TYPE) return
      const payload = msg.payload as CicloChangePayload | undefined
      if (!payload) return
      scheduleListInvalidate()
      if (typeof payload.id === 'number') {
        queryClient.invalidateQueries({ queryKey: ['ciclo', payload.id] })
      }
    })

    return () => {
      sub.close()
      if (listTimer) clearTimeout(listTimer)
    }
  }, [enabled, queryClient])
}
