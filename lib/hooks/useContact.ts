'use client'

import { useQuery } from '@tanstack/react-query'
import partnersApi from '../odoo/partners'

export function useContact(id: number | null) {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: () => partnersApi.getById(id!),
    enabled: id !== null && id > 0,
    staleTime: 1000 * 60 * 5,
    retry: (failureCount, error: unknown) => {
      const err = error as { code?: number }
      if (err?.code === 401 || err?.code === 403) return false
      return failureCount < 2
    },
  })
}

export function useCategories() {
  return useQuery({
    queryKey: ['partner-categories'],
    queryFn: partnersApi.getCategories,
    staleTime: Infinity,
  })
}

export function useCountries() {
  return useQuery({
    queryKey: ['countries'],
    queryFn: partnersApi.getCountries,
    staleTime: Infinity,
  })
}
