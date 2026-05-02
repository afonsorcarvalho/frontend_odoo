'use client'

import { AlertCircle, PenLine } from 'lucide-react'
import { clsx } from 'clsx'
import { useOsStore } from '@/lib/store/osStore'
import { useOsEquipments } from '@/lib/hooks/useOs'
import { FilterPanel as UiFilterPanel, FilterSection } from '@/components/ui/FilterPanel'
import {
  OS_STATE_LABEL,
  MAINTENANCE_TYPE_LABEL,
  type OsState,
  type MaintenanceType,
} from '@/lib/types/os'

const STATES: OsState[] = [
  'draft', 'under_budget', 'pause_budget', 'wait_authorization',
  'wait_parts', 'execution_ready', 'under_repair', 'pause_repair',
  'reproved', 'done', 'cancel',
]

const TYPES: MaintenanceType[] = [
  'corrective', 'preventive', 'instalacao', 'treinamento',
  'preditiva', 'qualification', 'loan', 'calibration',
]

export function OsFilterPanel() {
  const {
    ui, filters, closeFilterPanel,
    setStateFilter, setMaintenanceTypeFilter, setEquipmentFilter,
    toggleOnlyOverdue, toggleOnlyUnsigned, setDateFrom, setDateTo, resetFilters,
  } = useOsStore()

  const { data: equipments } = useOsEquipments()

  const activeCount =
    (filters.state ? 1 : 0) +
    (filters.maintenance_type ? 1 : 0) +
    (filters.equipment_id ? 1 : 0) +
    (filters.only_overdue ? 1 : 0) +
    (filters.only_unsigned ? 1 : 0) +
    (filters.date_from ? 1 : 0) +
    (filters.date_to ? 1 : 0)

  return (
    <UiFilterPanel
      open={ui.isFilterPanelOpen}
      onClose={closeFilterPanel}
      activeCount={activeCount}
      onReset={resetFilters}
    >
      <FilterSection title="Status">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setStateFilter(undefined)}
            className={clsx(
              'p-2 rounded-xl border text-xs font-medium transition-all col-span-2',
              !filters.state
                ? 'bg-neon-blue/10 border-neon-blue/40 text-neon-blue'
                : 'bg-white/[0.03] border-white/10 text-white/50 hover:text-white'
            )}
          >
            Todos
          </button>
          {STATES.map((st) => (
            <button
              key={st}
              onClick={() => setStateFilter(st)}
              className={clsx(
                'p-2 rounded-xl border text-xs font-medium transition-all truncate',
                filters.state === st
                  ? 'bg-neon-blue/10 border-neon-blue/40 text-neon-blue'
                  : 'bg-white/[0.03] border-white/10 text-white/50 hover:text-white'
              )}
            >
              {OS_STATE_LABEL[st]}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Tipo de Manutenção">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMaintenanceTypeFilter(undefined)}
            className={clsx(
              'p-2 rounded-xl border text-xs font-medium transition-all col-span-2',
              !filters.maintenance_type
                ? 'bg-neon-blue/10 border-neon-blue/40 text-neon-blue'
                : 'bg-white/[0.03] border-white/10 text-white/50 hover:text-white'
            )}
          >
            Todos
          </button>
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setMaintenanceTypeFilter(t)}
              className={clsx(
                'p-2 rounded-xl border text-xs font-medium transition-all truncate',
                filters.maintenance_type === t
                  ? 'bg-neon-blue/10 border-neon-blue/40 text-neon-blue'
                  : 'bg-white/[0.03] border-white/10 text-white/50 hover:text-white'
              )}
            >
              {MAINTENANCE_TYPE_LABEL[t]}
            </button>
          ))}
        </div>
      </FilterSection>

      {equipments && equipments.length > 0 && (
        <FilterSection title="Equipamento">
          <select
            value={filters.equipment_id ?? ''}
            onChange={(e) => setEquipmentFilter(e.target.value ? Number(e.target.value) : undefined)}
            className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-neon-blue/40"
          >
            <option value="" className="bg-dark-800">Todos</option>
            {equipments.map((e) => (
              <option key={e.id} value={e.id} className="bg-dark-800">
                {e.display_name ?? e.name}
              </option>
            ))}
          </select>
        </FilterSection>
      )}

      <FilterSection title="Programada entre">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-white/40">De</label>
            <input
              type="date"
              value={filters.date_from ?? ''}
              onChange={(e) => setDateFrom(e.target.value || undefined)}
              className="w-full px-2.5 py-2 rounded-lg text-xs bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-neon-blue/40"
            />
          </div>
          <div>
            <label className="text-[10px] text-white/40">Até</label>
            <input
              type="date"
              value={filters.date_to ?? ''}
              onChange={(e) => setDateTo(e.target.value || undefined)}
              className="w-full px-2.5 py-2 rounded-lg text-xs bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-neon-blue/40"
            />
          </div>
        </div>
      </FilterSection>

      <section className="space-y-2">
        <button
          onClick={toggleOnlyOverdue}
          className={clsx(
            'w-full flex items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all',
            filters.only_overdue
              ? 'bg-neon-pink/10 border-neon-pink/40 text-neon-pink'
              : 'bg-white/[0.03] border-white/10 text-white/60 hover:text-white'
          )}
        >
          <AlertCircle size={14} />
          Somente atrasadas
        </button>

        <button
          onClick={toggleOnlyUnsigned}
          className={clsx(
            'w-full flex items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all',
            filters.only_unsigned
              ? 'bg-neon-orange/10 border-neon-orange/40 text-neon-orange'
              : 'bg-white/[0.03] border-white/10 text-white/60 hover:text-white'
          )}
        >
          <PenLine size={14} />
          Somente não assinadas
        </button>
      </section>
    </UiFilterPanel>
  )
}
