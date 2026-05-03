'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { subscribeBus } from '../odoo/bus'
import { OS_KEY } from './useOs'

const EVENT_TYPE = 'engc_os.changed'
const LIST_INVALIDATE_DEBOUNCE_MS = 1500

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
 *
 * Invalidação da LISTA é debounced para agrupar rajadas de eventos em janela.
 * Detalhe é invalidado imediatamente (só dispara para o ID específico).
 */
export function useOsBus(enabled = true) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    let listTimer: ReturnType<typeof setTimeout> | null = null
    const scheduleListInvalidate = () => {
      if (listTimer) return
      listTimer = setTimeout(() => {
        listTimer = null
        queryClient.invalidateQueries({ queryKey: [OS_KEY] })
      }, LIST_INVALIDATE_DEBOUNCE_MS)
    }

    const sub = subscribeBus('/api/os/bus', (msg) => {
      if (msg.type !== EVENT_TYPE) return
      const payload = msg.payload as OsChangePayload | undefined
      if (!payload) return
      scheduleListInvalidate()
      if (typeof payload.id === 'number') {
        queryClient.invalidateQueries({ queryKey: ['os-detail', payload.id] })
      }
    })

    return () => {
      sub.close()
      if (listTimer) clearTimeout(listTimer)
    }
  }, [enabled, queryClient])
}
