'use client'

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import osApi from '../odoo/os'
import { useOsStore } from '../store/osStore'
import { useAuthStore } from '../store/authStore'
import { OS_ACTIVE_STATES, type OsFormData, type OsState } from '../types/os'

export const OS_KEY = 'os'

const LIST_REFETCH_MS = 30_000
const DETAIL_ACTIVE_REFETCH_MS = 15_000

export function useOsList() {
  const filters = useOsStore((s) => s.filters)
  const selectedCompanyId = useAuthStore((s) => s.selectedCompanyId)

  return useInfiniteQuery({
    queryKey: [OS_KEY, filters, selectedCompanyId],
    queryFn: ({ pageParam }) => osApi.listPage(filters, pageParam as number, 24, selectedCompanyId),
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
      allOs: data.pages.flatMap((p) => p.records),
      total: data.pages[0]?.total ?? 0,
    }),
  })
}

export function useOsDetail(id: number | null) {
  return useQuery({
    queryKey: ['os-detail', id],
    queryFn: () => osApi.getById(id!),
    enabled: id !== null && id > 0,
    staleTime: 1000 * 60 * 5,
    refetchInterval: (query) => {
      const state = query.state.data?.state
      return state && OS_ACTIVE_STATES.includes(state as OsState) ? DETAIL_ACTIVE_REFETCH_MS : false
    },
    refetchIntervalInBackground: false,
    retry: (failureCount, error: unknown) => {
      const err = error as { code?: number }
      if (err?.code === 401 || err?.code === 403) return false
      return failureCount < 2
    },
  })
}

export function useCreateOs() {
  const queryClient = useQueryClient()
  const closeModal = useOsStore((s) => s.closeFormModal)

  return useMutation({
    mutationFn: (data: OsFormData) => osApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OS_KEY] })
      toast.success('OS criada com sucesso!')
      closeModal()
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar OS: ${error.message}`)
    },
  })
}

export function useUpdateOs() {
  const queryClient = useQueryClient()
  const closeModal = useOsStore((s) => s.closeFormModal)

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<OsFormData> }) =>
      osApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [OS_KEY] })
      queryClient.invalidateQueries({ queryKey: ['os-detail', id] })
      toast.success('OS atualizada!')
      closeModal()
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`)
    },
  })
}

export function useTransitionOs() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, action, targetState }: {
      id: number
      action?: string
      targetState?: OsState
    }) => {
      if (action) {
        return osApi.callAction(id, action)
      }
      if (targetState) {
        return osApi.setState(id, targetState)
      }
      throw new Error('Informe action ou targetState')
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [OS_KEY] })
      queryClient.invalidateQueries({ queryKey: ['os-detail', id] })
      toast.success('Status atualizado.')
    },
    onError: (error: Error) => {
      toast.error(`Erro na transição: ${error.message}`)
    },
  })
}

export function useEmployees() {
  return useQuery({
    queryKey: ['employees'],
    queryFn: osApi.getEmployees,
    staleTime: Infinity,
  })
}

export function useDepartments() {
  return useQuery({
    queryKey: ['departments'],
    queryFn: osApi.getDepartments,
    staleTime: Infinity,
  })
}

export function useOsEquipments() {
  return useQuery({
    queryKey: ['os-equipments'],
    queryFn: osApi.getEquipments,
    staleTime: Infinity,
  })
}
