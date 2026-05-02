'use client'

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import partnersApi from '../odoo/partners'
import { useContactsStore } from '../store/contactsStore'
import { useAuthStore } from '../store/authStore'
import type { PartnerFormData } from '../types/partner'

export const CONTACTS_KEY = 'contacts'

export function useContacts() {
  const filters = useContactsStore((s) => s.filters)
  const selectedCompanyId = useAuthStore((s) => s.selectedCompanyId)

  return useInfiniteQuery({
    queryKey: [CONTACTS_KEY, filters, selectedCompanyId],
    queryFn: ({ pageParam }) => partnersApi.listPage(filters, pageParam as number, 24, selectedCompanyId),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
    select: (data) => ({
      pages: data.pages,
      pageParams: data.pageParams,
      allContacts: data.pages.flatMap((p) => p.records),
      total: data.pages[0]?.total ?? 0,
    }),
  })
}

export function useCreateContact() {
  const queryClient = useQueryClient()
  const closeModal = useContactsStore((s) => s.closeFormModal)

  return useMutation({
    mutationFn: (data: PartnerFormData) => partnersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_KEY] })
      toast.success('Contato criado com sucesso!')
      closeModal()
    },
    onError: (error: Error) => {
      toast.error(`Erro ao criar contato: ${error.message}`)
    },
  })
}

export function useUpdateContact() {
  const queryClient = useQueryClient()
  const closeModal = useContactsStore((s) => s.closeFormModal)

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PartnerFormData> }) =>
      partnersApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_KEY] })
      queryClient.invalidateQueries({ queryKey: ['contact', id] })
      toast.success('Contato atualizado!')
      closeModal()
    },
    onError: (error: Error) => {
      toast.error(`Erro ao atualizar: ${error.message}`)
    },
  })
}

export function useArchiveContact() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => partnersApi.archive(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CONTACTS_KEY] })
      toast.success('Contato arquivado.')
    },
    onError: (error: Error) => {
      toast.error(`Erro: ${error.message}`)
    },
  })
}
