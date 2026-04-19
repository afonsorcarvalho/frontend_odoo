'use client'

import { useContactsStore } from '@/lib/store/contactsStore'
import { SearchBar as UiSearchBar } from '@/components/ui/SearchBar'

interface Props {
  isLoading?: boolean
  totalResults?: number
}

export function SearchBar({ isLoading, totalResults }: Props) {
  const initialValue = useContactsStore.getState().filters.search
  const setSearch = useContactsStore((s) => s.setSearch)

  return (
    <UiSearchBar
      initialValue={initialValue}
      onSearch={setSearch}
      placeholder="Buscar contatos por nome, e-mail, telefone ou cidade..."
      totalResults={totalResults}
      resultLabel={(n) => `${n.toLocaleString('pt-BR')} resultado${n !== 1 ? 's' : ''}`}
      isLoading={isLoading}
    />
  )
}
