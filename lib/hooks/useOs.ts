'use client'

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import osApi from '../odoo/os'
import { useOsStore } from '../store/osStore'
import { useAuthStore } from '../store/authStore'
import {
  OS_ACTIVE_STATES,
  type OsFormData,
  type OsState,
  type OsRelatorioFormData,
  type OsRequestPartFormData,
  type OsPartState,
} from '../types/os'

export const OS_KEY = 'os'

const LIST_REFETCH_MS = 5 * 60_000
const DETAIL_ACTIVE_REFETCH_MS = 2 * 60_000

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

// ─── Checklist ────────────────────────────────────────────────────────────────

export function useOsChecklist(osId: number | null) {
  return useQuery({
    queryKey: ['os-checklist', osId],
    queryFn: () => osApi.getChecklist(osId!),
    enabled: osId !== null && osId > 0,
    staleTime: 1000 * 60 * 2,
  })
}

export function useToggleChecklistItem(osId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, vals }: { id: number; vals: { check?: boolean; medicao?: number; observations?: string } }) =>
      osApi.updateChecklistItem(id, vals),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os-checklist', osId] })
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar item: ${error.message}`)
    },
  })
}

export function useGenerateChecklist(osId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => osApi.generateChecklist(osId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os-checklist', osId] })
      queryClient.invalidateQueries({ queryKey: ['os-detail', osId] })
      toast.success('Checklist gerado!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao gerar checklist: ${error.message}`)
    },
  })
}

// ─── Relatórios ───────────────────────────────────────────────────────────────

export function useOsRelatorios(osId: number | null) {
  return useQuery({
    queryKey: ['os-relatorios', osId],
    queryFn: () => osApi.getRelatorios(osId!),
    enabled: osId !== null && osId > 0,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreateRelatorio(osId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vals: OsRelatorioFormData) => osApi.createRelatorio(vals),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os-relatorios', osId] })
      queryClient.invalidateQueries({ queryKey: ['os-detail', osId] })
      toast.success('Relatório criado!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar relatório: ${error.message}`)
    },
  })
}

export function useUpdateRelatorio(osId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, vals }: { id: number; vals: Partial<OsRelatorioFormData> }) =>
      osApi.updateRelatorio(id, vals),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os-relatorios', osId] })
      toast.success('Relatório atualizado!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar relatório: ${error.message}`)
    },
  })
}

export function useDeleteRelatorio(osId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => osApi.deleteRelatorio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os-relatorios', osId] })
      queryClient.invalidateQueries({ queryKey: ['os-detail', osId] })
      toast.success('Relatório removido.')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover: ${error.message}`)
    },
  })
}

export function useDoneRelatorio(osId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => osApi.doneRelatorio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os-relatorios', osId] })
      queryClient.invalidateQueries({ queryKey: ['os-detail', osId] })
      queryClient.invalidateQueries({ queryKey: [OS_KEY] })
      toast.success('Relatório concluído!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao concluir: ${error.message}`)
    },
  })
}

export function useCancelRelatorio(osId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => osApi.cancelRelatorio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os-relatorios', osId] })
      queryClient.invalidateQueries({ queryKey: ['os-detail', osId] })
      toast.success('Relatório cancelado.')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao cancelar: ${error.message}`)
    },
  })
}

// ─── Peças ────────────────────────────────────────────────────────────────────

export function useOsParts(osId: number | null) {
  return useQuery({
    queryKey: ['os-parts', osId],
    queryFn: () => osApi.getParts(osId!),
    enabled: osId !== null && osId > 0,
    staleTime: 1000 * 60 * 2,
  })
}

export function useCreatePart(osId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (vals: OsRequestPartFormData) => osApi.createPart(vals),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os-parts', osId] })
      queryClient.invalidateQueries({ queryKey: ['os-detail', osId] })
      toast.success('Peça solicitada!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao solicitar peça: ${error.message}`)
    },
  })
}

export function useUpdatePartState(osId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, state }: { id: number; state: OsPartState }) =>
      osApi.updatePartState(id, state),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os-parts', osId] })
      queryClient.invalidateQueries({ queryKey: ['os-detail', osId] })
      toast.success('Estado atualizado.')
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`)
    },
  })
}

export function useApplyPart(osId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ partId, relatorioId }: { partId: number; relatorioId: number }) =>
      osApi.applyPartToRelatorio(partId, relatorioId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os-parts', osId] })
      queryClient.invalidateQueries({ queryKey: ['os-detail', osId] })
      toast.success('Peça aplicada!')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao aplicar: ${error.message}`)
    },
  })
}

export function useDeletePart(osId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => osApi.deletePart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['os-parts', osId] })
      queryClient.invalidateQueries({ queryKey: ['os-detail', osId] })
      toast.success('Peça removida.')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover: ${error.message}`)
    },
  })
}

// ─── Dropdowns ────────────────────────────────────────────────────────────────

export function useProducts(search = '') {
  return useQuery({
    queryKey: ['os-products', search],
    queryFn: () => osApi.getProducts(search),
    staleTime: 1000 * 60 * 5,
  })
}

export function usePeriodicityNames(ids: number[] | false | undefined) {
  const key = ids ? [...ids].sort().join(',') : ''
  return useQuery({
    queryKey: ['periodicity-names', key],
    queryFn: () => osApi.getPeriodicityNames(ids as number[]),
    enabled: !!ids && ids.length > 0,
    staleTime: 1000 * 60 * 30,
  })
}

export function usePartners(filter: 'company' | 'all' = 'all') {
  return useQuery({
    queryKey: ['os-partners', filter],
    queryFn: () => osApi.getPartners(filter),
    staleTime: Infinity,
  })
}
