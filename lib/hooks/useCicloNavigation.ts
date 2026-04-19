'use client'

import { useQueryClient } from '@tanstack/react-query'
import { CICLOS_KEY } from './useCiclos'
import { useCiclosStore } from '../store/ciclosStore'

interface InfiniteCache {
  pages: Array<{
    records: Array<{ id: number }>
    nextCursor: number | null
    total: number
  }>
}

/**
 * Retorna os IDs vizinhos (anterior e próximo) do ciclo atual
 * dentro da lista carregada no cache do React Query.
 * Respeita os filtros ativos na store.
 */
export function useCicloNavigation(currentId: number) {
  const filters = useCiclosStore((s) => s.filters)
  const client = useQueryClient()

  const data = client.getQueryData<InfiniteCache>([CICLOS_KEY, filters])
  const ids = data?.pages.flatMap((p) => p.records.map((r) => r.id)) ?? []

  const total = data?.pages[0]?.total ?? 0
  const loadedCount = ids.length
  const hasMoreToLoad = loadedCount < total
  const index = ids.indexOf(currentId)
  const position = index >= 0 ? index + 1 : null

  return {
    prevId: index > 0 ? ids[index - 1] : null,
    nextId: index >= 0 && index < ids.length - 1 ? ids[index + 1] : null,
    position,
    loadedCount,
    total,
    hasMoreToLoad,
    isInCache: index >= 0,
  }
}
