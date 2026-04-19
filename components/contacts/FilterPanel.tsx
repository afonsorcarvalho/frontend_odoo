'use client'

import { Building2, User, Users } from 'lucide-react'
import { useContactsStore } from '@/lib/store/contactsStore'
import { useCategories, useCountries } from '@/lib/hooks/useContact'
import { NeonBadge } from '@/components/ui/NeonBadge'
import { FilterPanel as UiFilterPanel, FilterSection } from '@/components/ui/FilterPanel'
import { clsx } from 'clsx'

export function FilterPanel() {
  const {
    ui, filters, closeFilterPanel,
    setTypeFilter, setCountryFilter, toggleCategoryFilter, resetFilters,
  } = useContactsStore()
  const { data: categories } = useCategories()
  const { data: countries } = useCountries()

  const activeCount =
    (filters.type !== 'all' ? 1 : 0) +
    (filters.country_id ? 1 : 0) +
    filters.category_ids.length

  return (
    <UiFilterPanel
      open={ui.isFilterPanelOpen}
      onClose={closeFilterPanel}
      activeCount={activeCount}
      onReset={resetFilters}
    >
      <FilterSection title="Tipo">
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'all', label: 'Todos', icon: <Users size={14} /> },
            { value: 'company', label: 'Empresa', icon: <Building2 size={14} /> },
            { value: 'person', label: 'Pessoa', icon: <User size={14} /> },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTypeFilter(opt.value as 'all' | 'company' | 'person')}
              className={clsx(
                'flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-all',
                filters.type === opt.value
                  ? 'bg-neon-blue/10 border-neon-blue/40 text-neon-blue'
                  : 'bg-white/[0.03] border-white/10 text-white/50 hover:text-white hover:bg-white/[0.06]'
              )}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {categories && categories.length > 0 && (
        <FilterSection title="Tags">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => toggleCategoryFilter(cat.id)}
                className="transition-transform hover:scale-105"
              >
                <NeonBadge
                  color={filters.category_ids.includes(cat.id) ? 'blue' : 'purple'}
                  dot={filters.category_ids.includes(cat.id)}
                >
                  {cat.name}
                </NeonBadge>
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {countries && countries.length > 0 && (
        <FilterSection title="País">
          <select
            value={filters.country_id ?? ''}
            onChange={(e) =>
              setCountryFilter(e.target.value ? Number(e.target.value) : undefined)
            }
            className={clsx(
              'w-full px-3 py-2.5 rounded-xl text-sm',
              'bg-white/[0.04] border border-white/10 text-white',
              'focus:outline-none focus:border-neon-blue/40',
              'transition-colors'
            )}
          >
            <option value="" className="bg-dark-800">
              Todos os países
            </option>
            {countries.map((c) => (
              <option key={c.id} value={c.id} className="bg-dark-800">
                {c.name}
              </option>
            ))}
          </select>
        </FilterSection>
      )}
    </UiFilterPanel>
  )
}
