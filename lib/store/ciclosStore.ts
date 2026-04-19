'use client'

import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import type { CycleFilters } from '../types/ciclo'

const DEFAULT_FILTERS: CycleFilters = {
  search: '',
  state: undefined,
  equipment_id: undefined,
  cycle_type_id: undefined,
  only_overdue: false,
  only_signed: false,
  date_from: undefined,
  date_to: undefined,
}

interface UIState {
  viewMode: 'grid' | 'list'
  isFilterPanelOpen: boolean
}

interface CiclosStore {
  filters: CycleFilters
  setSearch: (search: string) => void
  setStateFilter: (state: CycleFilters['state']) => void
  setEquipmentFilter: (equipment_id: number | undefined) => void
  setCycleTypeFilter: (cycle_type_id: number | undefined) => void
  toggleOnlyOverdue: () => void
  toggleOnlySigned: () => void
  setDateFrom: (d: string | undefined) => void
  setDateTo: (d: string | undefined) => void
  resetFilters: () => void

  ui: UIState
  setViewMode: (mode: 'grid' | 'list') => void
  openFilterPanel: () => void
  closeFilterPanel: () => void
}

export const useCiclosStore = create<CiclosStore>()(
  devtools(
    persist(
      subscribeWithSelector((set) => ({
        filters: DEFAULT_FILTERS,

        setSearch: (search) => set((s) => ({ filters: { ...s.filters, search } })),
        setStateFilter: (state) => set((s) => ({ filters: { ...s.filters, state } })),
        setEquipmentFilter: (equipment_id) => set((s) => ({ filters: { ...s.filters, equipment_id } })),
        setCycleTypeFilter: (cycle_type_id) => set((s) => ({ filters: { ...s.filters, cycle_type_id } })),
        toggleOnlyOverdue: () => set((s) => ({ filters: { ...s.filters, only_overdue: !s.filters.only_overdue } })),
        toggleOnlySigned: () => set((s) => ({ filters: { ...s.filters, only_signed: !s.filters.only_signed } })),
        setDateFrom: (date_from) => set((s) => ({ filters: { ...s.filters, date_from } })),
        setDateTo: (date_to) => set((s) => ({ filters: { ...s.filters, date_to } })),
        resetFilters: () => set({ filters: DEFAULT_FILTERS }),

        ui: { viewMode: 'grid', isFilterPanelOpen: false },
        setViewMode: (viewMode) => set((s) => ({ ui: { ...s.ui, viewMode } })),
        openFilterPanel: () => set((s) => ({ ui: { ...s.ui, isFilterPanelOpen: true } })),
        closeFilterPanel: () => set((s) => ({ ui: { ...s.ui, isFilterPanelOpen: false } })),
      })),
      {
        name: 'ciclos-store',
        partialize: (state) => ({
          filters: state.filters,
          ui: { viewMode: state.ui.viewMode },
        }),
      }
    ),
    { name: 'CiclosStore' }
  )
)
