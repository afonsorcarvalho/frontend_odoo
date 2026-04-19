'use client'

import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import ciclosApi from '../odoo/ciclos'
import { useCiclosStore } from '../store/ciclosStore'

export const CICLOS_KEY = 'ciclos'

const LIST_REFETCH_MS = 30_000
const DETAIL_ACTIVE_REFETCH_MS = 15_000

export function useCiclos() {
  const filters = useCiclosStore((s) => s.filters)

  return useInfiniteQuery({
    queryKey: [CICLOS_KEY, filters],
    queryFn: ({ pageParam }) => ciclosApi.listPage(filters, pageParam as number, 24),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    refetchInterval: LIST_REFETCH_MS,
    refetchIntervalInBackground: false,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      allCycles: data.pages.flatMap((p) => p.records),
      total: data.pages[0]?.total ?? 0,
    }),
  })
}

export function useCiclo(id: number | null) {
  return useQuery({
    queryKey: ['ciclo', id],
    queryFn: () => ciclosApi.getById(id!),
    enabled: id !== null && id > 0,
    staleTime: 1000 * 60 * 5,
    refetchInterval: (query) =>
      query.state.data?.state === 'em_andamento' ? DETAIL_ACTIVE_REFETCH_MS : false,
    refetchIntervalInBackground: false,
    retry: (failureCount, error: unknown) => {
      const err = error as { code?: number }
      if (err?.code === 401 || err?.code === 403) return false
      return failureCount < 2
    },
  })
}

export function useEquipments() {
  return useQuery({
    queryKey: ['equipments'],
    queryFn: ciclosApi.getEquipments,
    staleTime: Infinity,
  })
}

export function useCycleTypes() {
  return useQuery({
    queryKey: ['cycle-types'],
    queryFn: ciclosApi.getCycleTypes,
    staleTime: Infinity,
  })
}

export function useCycleMaterials(cycleId: number | null) {
  return useQuery({
    queryKey: ['cycle-materials', cycleId],
    queryFn: () => ciclosApi.getMaterialsForCycle(cycleId!),
    enabled: cycleId !== null && cycleId > 0,
    staleTime: 1000 * 60 * 5,
  })
}
