'use client'

import { useCiclosStore } from '@/lib/store/ciclosStore'
import { SearchBar as UiSearchBar } from '@/components/ui/SearchBar'

interface Props {
  isLoading?: boolean
  totalResults?: number
}

export function SearchBar({ isLoading, totalResults }: Props) {
  const initialValue = useCiclosStore.getState().filters.search
  const setSearch = useCiclosStore((s) => s.setSearch)

  return (
    <UiSearchBar
      initialValue={initialValue}
      onSearch={setSearch}
      placeholder="Buscar ciclos por nome, lote ou equipamento..."
      totalResults={totalResults}
      resultLabel={(n) => `${n.toLocaleString('pt-BR')} ciclo${n !== 1 ? 's' : ''}`}
      isLoading={isLoading}
    />
  )
}
