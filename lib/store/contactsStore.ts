'use client'

import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import type { ContactFilters } from '../types/partner'

const DEFAULT_FILTERS: ContactFilters = {
  search: '',
  type: 'all',
  country_id: undefined,
  category_ids: [],
  active: true,
}

interface UIState {
  viewMode: 'grid' | 'list'
  selectedIds: number[]
  isFilterPanelOpen: boolean
  isFormModalOpen: boolean
  editingPartnerId: number | null
}

interface ContactsStore {
  filters: ContactFilters
  setSearch: (search: string) => void
  setTypeFilter: (type: ContactFilters['type']) => void
  setCountryFilter: (country_id: number | undefined) => void
  toggleCategoryFilter: (categoryId: number) => void
  resetFilters: () => void

  ui: UIState
  setViewMode: (mode: 'grid' | 'list') => void
  toggleSelection: (id: number) => void
  clearSelection: () => void
  selectAll: (ids: number[]) => void
  openFilterPanel: () => void
  closeFilterPanel: () => void
  openFormModal: (partnerId?: number) => void
  closeFormModal: () => void
}

export const useContactsStore = create<ContactsStore>()(
  devtools(
    persist(
      subscribeWithSelector((set) => ({
        filters: DEFAULT_FILTERS,

        setSearch: (search) =>
          set((s) => ({ filters: { ...s.filters, search } })),

        setTypeFilter: (type) =>
          set((s) => ({ filters: { ...s.filters, type } })),

        setCountryFilter: (country_id) =>
          set((s) => ({ filters: { ...s.filters, country_id } })),

        toggleCategoryFilter: (categoryId) =>
          set((s) => {
            const current = s.filters.category_ids
            const next = current.includes(categoryId)
              ? current.filter((id) => id !== categoryId)
              : [...current, categoryId]
            return { filters: { ...s.filters, category_ids: next } }
          }),

        resetFilters: () => set({ filters: DEFAULT_FILTERS }),

        ui: {
          viewMode: 'grid',
          selectedIds: [],
          isFilterPanelOpen: false,
          isFormModalOpen: false,
          editingPartnerId: null,
        },

        setViewMode: (viewMode) =>
          set((s) => ({ ui: { ...s.ui, viewMode } })),

        toggleSelection: (id) =>
          set((s) => {
            const current = s.ui.selectedIds
            const next = current.includes(id)
              ? current.filter((sid) => sid !== id)
              : [...current, id]
            return { ui: { ...s.ui, selectedIds: next } }
          }),

        clearSelection: () =>
          set((s) => ({ ui: { ...s.ui, selectedIds: [] } })),

        selectAll: (ids) =>
          set((s) => ({ ui: { ...s.ui, selectedIds: ids } })),

        openFilterPanel: () =>
          set((s) => ({ ui: { ...s.ui, isFilterPanelOpen: true } })),

        closeFilterPanel: () =>
          set((s) => ({ ui: { ...s.ui, isFilterPanelOpen: false } })),

        openFormModal: (partnerId) =>
          set((s) => ({
            ui: {
              ...s.ui,
              isFormModalOpen: true,
              editingPartnerId: partnerId ?? null,
            },
          })),

        closeFormModal: () =>
          set((s) => ({
            ui: {
              ...s.ui,
              isFormModalOpen: false,
              editingPartnerId: null,
            },
          })),
      })),
      {
        name: 'contacts-store',
        partialize: (state) => ({
          filters: state.filters,
          ui: { viewMode: state.ui.viewMode },
        }),
      }
    ),
    { name: 'ContactsStore' }
  )
)
