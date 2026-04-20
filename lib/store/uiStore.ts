'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  dashboardMode: boolean
  toggleDashboardMode: () => void
  setDashboardMode: (v: boolean) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      dashboardMode: false,
      toggleDashboardMode: () => set((s) => ({ dashboardMode: !s.dashboardMode })),
      setDashboardMode: (v) => set({ dashboardMode: v }),
    }),
    { name: 'ui-prefs' }
  )
)
