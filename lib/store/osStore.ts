'use client'

import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import type { OsFilters } from '../types/os'

const DEFAULT_FILTERS: OsFilters = {
  search: '',
  state: undefined,
  maintenance_type: undefined,
  equipment_id: undefined,
  only_overdue: false,
  only_unsigned: false,
  date_from: undefined,
  date_to: undefined,
}

interface UIState {
  viewMode: 'grid' | 'list'
  isFilterPanelOpen: boolean
  isFormModalOpen: boolean
  editingOsId: number | null
}

interface OsStore {
  filters: OsFilters
  setSearch: (search: string) => void
  setStateFilter: (state: OsFilters['state']) => void
  setMaintenanceTypeFilter: (maintenance_type: OsFilters['maintenance_type']) => void
  setEquipmentFilter: (equipment_id: number | undefined) => void
  toggleOnlyOverdue: () => void
  toggleOnlyUnsigned: () => void
  setDateFrom: (d: string | undefined) => void
  setDateTo: (d: string | undefined) => void
  resetFilters: () => void

  ui: UIState
  setViewMode: (mode: 'grid' | 'list') => void
  openFilterPanel: () => void
  closeFilterPanel: () => void
  openFormModal: (editingOsId?: number | null) => void
  closeFormModal: () => void

  loadingDetailId: number | null
  setLoadingDetailId: (id: number | null) => void
}

export const useOsStore = create<OsStore>()(
  devtools(
    persist(
      subscribeWithSelector((set) => ({
        filters: DEFAULT_FILTERS,

        setSearch: (search) => set((s) => ({ filters: { ...s.filters, search } })),
        setStateFilter: (state) => set((s) => ({ filters: { ...s.filters, state } })),
        setMaintenanceTypeFilter: (maintenance_type) => set((s) => ({ filters: { ...s.filters, maintenance_type } })),
        setEquipmentFilter: (equipment_id) => set((s) => ({ filters: { ...s.filters, equipment_id } })),
        toggleOnlyOverdue: () => set((s) => ({ filters: { ...s.filters, only_overdue: !s.filters.only_overdue } })),
        toggleOnlyUnsigned: () => set((s) => ({ filters: { ...s.filters, only_unsigned: !s.filters.only_unsigned } })),
        setDateFrom: (date_from) => set((s) => ({ filters: { ...s.filters, date_from } })),
        setDateTo: (date_to) => set((s) => ({ filters: { ...s.filters, date_to } })),
        resetFilters: () => set({ filters: DEFAULT_FILTERS }),

        ui: { viewMode: 'grid', isFilterPanelOpen: false, isFormModalOpen: false, editingOsId: null },
        setViewMode: (viewMode) => set((s) => ({ ui: { ...s.ui, viewMode } })),
        openFilterPanel: () => set((s) => ({ ui: { ...s.ui, isFilterPanelOpen: true } })),
        closeFilterPanel: () => set((s) => ({ ui: { ...s.ui, isFilterPanelOpen: false } })),
        openFormModal: (editingOsId = null) => set((s) => ({ ui: { ...s.ui, isFormModalOpen: true, editingOsId } })),
        closeFormModal: () => set((s) => ({ ui: { ...s.ui, isFormModalOpen: false, editingOsId: null } })),

        loadingDetailId: null,
        setLoadingDetailId: (id) => set({ loadingDetailId: id }),
      })),
      {
        name: 'os-store',
        partialize: (state) => ({
          filters: state.filters,
          ui: { viewMode: state.ui.viewMode },
        }),
      }
    ),
    { name: 'OsStore' }
  )
)
