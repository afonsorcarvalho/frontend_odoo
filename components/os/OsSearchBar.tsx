'use client'

import { useOsStore } from '@/lib/store/osStore'
import { SearchBar as UiSearchBar } from '@/components/ui/SearchBar'

interface Props {
  isLoading?: boolean
  totalResults?: number
}

export function OsSearchBar({ isLoading, totalResults }: Props) {
  const initialValue = useOsStore.getState().filters.search
  const setSearch = useOsStore((s) => s.setSearch)

  return (
    <UiSearchBar
      initialValue={initialValue}
      onSearch={setSearch}
      placeholder="Buscar OS por número, solicitante ou equipamento..."
      totalResults={totalResults}
      resultLabel={(n) => `${n.toLocaleString('pt-BR')} OS`}
      isLoading={isLoading}
    />
  )
}
