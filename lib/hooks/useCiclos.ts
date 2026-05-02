'use client'

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import ciclosApi from '../odoo/ciclos'
import { useCiclosStore } from '../store/ciclosStore'
import { useAuthStore } from '../store/authStore'
import type { IBFormData, IBLoteCreateData, MaterialLineFormData, CicloFotoCreateData } from '../types/ciclo'

export const CICLOS_KEY = 'ciclos'

const LIST_REFETCH_MS = 30_000
const DETAIL_ACTIVE_REFETCH_MS = 15_000

export function useCiclos() {
  const filters = useCiclosStore((s) => s.filters)
  const selectedCompanyId = useAuthStore((s) => s.selectedCompanyId)

  return useInfiniteQuery({
    queryKey: [CICLOS_KEY, filters, selectedCompanyId],
    queryFn: ({ pageParam }) => ciclosApi.listPage(filters, pageParam as number, 24, selectedCompanyId),
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

export function useCycleFeatures() {
  return useQuery({
    queryKey: ['cycle-features'],
    queryFn: ciclosApi.getCycleFeatures,
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

export function useIBLotes() {
  return useQuery({
    queryKey: ['ib-lotes'],
    queryFn: ciclosApi.getIBLotes,
    staleTime: Infinity,
  })
}

export function useCreateIBLote(onSuccess?: (newId: number) => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: IBLoteCreateData) => ciclosApi.createIBLote(data),
    onSuccess: (newId) => {
      queryClient.invalidateQueries({ queryKey: ['ib-lotes'] })
      toast.success('Lote criado.')
      onSuccess?.(newId)
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar lote: ${error.message}`)
    },
  })
}

export function useMaterialsCatalog() {
  return useQuery({
    queryKey: ['materials-catalog'],
    queryFn: ciclosApi.getMaterialsCatalog,
    staleTime: Infinity,
  })
}

export function useUpdateCicloIB(cycleId: number, onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: IBFormData) => ciclosApi.updateIB(cycleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ciclo', cycleId] })
      toast.success('Indicador biológico atualizado.')
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.error(`Erro ao salvar IB: ${error.message}`)
    },
  })
}

export function useAddMaterialLine(cycleId: number, onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: MaterialLineFormData) => ciclosApi.addMaterialLine(cycleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle-materials', cycleId] })
      toast.success('Material adicionado.')
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.error(`Erro ao adicionar material: ${error.message}`)
    },
  })
}

export function useUpdateMaterialLine(cycleId: number, onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ lineId, data }: { lineId: number; data: Partial<MaterialLineFormData> }) =>
      ciclosApi.updateMaterialLine(lineId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle-materials', cycleId] })
      toast.success('Material atualizado.')
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar material: ${error.message}`)
    },
  })
}

export function useDeleteMaterialLine(cycleId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (lineId: number) => ciclosApi.deleteMaterialLine(lineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cycle-materials', cycleId] })
      toast.success('Material removido.')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover material: ${error.message}`)
    },
  })
}

export function useForceConcludeCycle(cycleId: number, onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => ciclosApi.forceConclude(cycleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ciclo', cycleId] })
      queryClient.invalidateQueries({ queryKey: [CICLOS_KEY] })
      toast.success('Ciclo concluído.')
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.error(`Erro ao concluir ciclo: ${error.message}`)
    },
  })
}

export function useCicloFotos(cycleId: number | null) {
  return useQuery({
    queryKey: ['ciclo-fotos', cycleId],
    queryFn: () => ciclosApi.getFotos(cycleId!),
    enabled: cycleId !== null && cycleId > 0,
    staleTime: 1000 * 60 * 5,
  })
}

export function useAddCicloFoto(cycleId: number, onSuccess?: () => void) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CicloFotoCreateData) => ciclosApi.createFoto(cycleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ciclo-fotos', cycleId] })
      toast.success('Foto adicionada.')
      onSuccess?.()
    },
    onError: (error: Error) => {
      toast.error(`Erro ao enviar foto: ${error.message}`)
    },
  })
}

export function useDeleteCicloFoto(cycleId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (fotoId: number) => ciclosApi.deleteFoto(fotoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ciclo-fotos', cycleId] })
      toast.success('Foto removida.')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao remover foto: ${error.message}`)
    },
  })
}

export function useUpdateCicloFoto(cycleId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { titulo?: string; legenda?: string } }) =>
      ciclosApi.updateFoto(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ciclo-fotos', cycleId] })
      toast.success('Foto actualizada.')
    },
    onError: (error: Error) => {
      toast.error(`Erro ao actualizar foto: ${error.message}`)
    },
  })
}
