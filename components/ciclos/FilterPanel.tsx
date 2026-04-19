'use client'

import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { useCiclosStore } from '@/lib/store/ciclosStore'
import { useEquipments, useCycleTypes } from '@/lib/hooks/useCiclos'
import { FilterPanel as UiFilterPanel, FilterSection } from '@/components/ui/FilterPanel'
import { CYCLE_STATE_LABEL, type CycleState } from '@/lib/types/ciclo'
import { clsx } from 'clsx'

const STATES: CycleState[] = [
  'em_andamento', 'concluido', 'aguardando', 'pausado', 'cancelado', 'abortado', 'erro',
]

export function FilterPanel() {
  const {
    ui, filters, closeFilterPanel,
    setStateFilter, setEquipmentFilter, setCycleTypeFilter,
    toggleOnlyOverdue, toggleOnlySigned,
    setDateFrom, setDateTo, resetFilters,
  } = useCiclosStore()

  const { data: equipments } = useEquipments()
  const { data: cycleTypes } = useCycleTypes()

  const activeCount =
    (filters.state ? 1 : 0) +
    (filters.equipment_id ? 1 : 0) +
    (filters.cycle_type_id ? 1 : 0) +
    (filters.only_overdue ? 1 : 0) +
    (filters.only_signed ? 1 : 0) +
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
              {CYCLE_STATE_LABEL[st]}
            </button>
          ))}
        </div>
      </FilterSection>

      {equipments && equipments.length > 0 && (
        <FilterSection title="Equipamento">
          <select
            value={filters.equipment_id ?? ''}
            onChange={(e) =>
              setEquipmentFilter(e.target.value ? Number(e.target.value) : undefined)
            }
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

      {cycleTypes && cycleTypes.length > 0 && (
        <FilterSection title="Tipo de Ciclo">
          <select
            value={filters.cycle_type_id ?? ''}
            onChange={(e) =>
              setCycleTypeFilter(e.target.value ? Number(e.target.value) : undefined)
            }
            className="w-full px-3 py-2.5 rounded-xl text-sm bg-white/[0.04] border border-white/10 text-white focus:outline-none focus:border-neon-blue/40"
          >
            <option value="" className="bg-dark-800">Todos</option>
            {cycleTypes.map((t) => (
              <option key={t.id} value={t.id} className="bg-dark-800">
                {t.display_name ?? t.name}
              </option>
            ))}
          </select>
        </FilterSection>
      )}

      <FilterSection title="Período">
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
          Somente atrasados
        </button>
        <button
          onClick={toggleOnlySigned}
          className={clsx(
            'w-full flex items-center gap-2 p-3 rounded-xl border text-xs font-medium transition-all',
            filters.only_signed
              ? 'bg-neon-green/10 border-neon-green/40 text-neon-green'
              : 'bg-white/[0.03] border-white/10 text-white/60 hover:text-white'
          )}
        >
          <CheckCircle2 size={14} />
          Somente assinados
        </button>
      </section>
    </UiFilterPanel>
  )
}
