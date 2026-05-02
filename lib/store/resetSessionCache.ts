/**
 * Reset completo de estado do cliente ao trocar de servidor ou usuário.
 *
 * Inclui:
 *  - React Query cache (queries de contatos, ciclos, materiais, etc.)
 *  - schemaStore (fields_get + check_access_rights)
 *  - contactsStore (filtros persistidos)
 *  - ciclosStore (filtros persistidos)
 *  - authStore.company (logo/nome da empresa anterior)
 *
 * Não mexe em serverUrl/dbName — essas são as próprias credenciais novas.
 */
import type { QueryClient } from '@tanstack/react-query'
import { useSchemaStore } from './schemaStore'
import { useContactsStore } from './contactsStore'
import { useCiclosStore } from './ciclosStore'
import { useAuthStore } from './authStore'

export function resetSessionCache(queryClient?: QueryClient | null): void {
  // React Query: invalida todas as queries e descarta cache
  if (queryClient) {
    queryClient.cancelQueries()
    queryClient.clear()
  }

  // Schema (campos + permissões)
  useSchemaStore.getState().clear()

  // Filtros persistidos
  useContactsStore.getState().resetFilters()
  useCiclosStore.getState().resetFilters()

  // Company cacheada (evita mostrar logo da empresa anterior)
  useAuthStore.getState().setCompany(null, '', null)
  useAuthStore.getState().setAvailableCompanies([])
  useAuthStore.getState().setSelectedCompany(null)
}
