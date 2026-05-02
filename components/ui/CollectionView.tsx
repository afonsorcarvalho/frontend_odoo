'use client'

import { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutGrid, List, Loader2, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'

export type ViewMode = 'grid' | 'list'

export interface CollectionViewProps<T> {
  items: T[] | undefined
  viewMode: ViewMode
  onViewModeChange: (m: ViewMode) => void
  getKey: (item: T) => string | number

  /** Render cada item como card (modo grid) */
  renderCard: (item: T, ctx: { loading: boolean; onClick: () => void }) => ReactNode
  /** Render cada item como linha (modo lista) */
  renderRow: (item: T, ctx: { loading: boolean; onClick: () => void }) => ReactNode
  /** Click handler central */
  onItemClick?: (item: T) => void

  /** Qual item está em loading (overlay "Abrindo...") */
  loadingId?: string | number | null

  title?: string
  icon?: ReactNode
  count?: number
  actions?: ReactNode

  isLoading?: boolean
  error?: unknown
  emptyMessage?: string
  emptyIcon?: ReactNode

  /** Customiza grid cols (default: 1 md:2 lg:3) */
  gridCols?: string
  className?: string
}

export function CollectionView<T>({
  items,
  viewMode,
  onViewModeChange,
  getKey,
  renderCard,
  renderRow,
  onItemClick,
  loadingId,
  title,
  icon,
  count,
  actions,
  isLoading,
  error,
  emptyMessage = 'Nenhum registro',
  emptyIcon,
  gridCols = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  className,
}: CollectionViewProps<T>) {
  const itemCount = count ?? items?.length ?? 0

  return (
    <div className={clsx('space-y-3', className)}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {icon}
            {title && <h3 className="text-sm font-semibold text-white">{title}</h3>}
            {items && (
              <span className="text-[10px] text-white/40 font-mono">
                {itemCount} {itemCount === 1 ? 'item' : 'itens'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {actions}
            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-white/5 border border-white/10">
              <ViewToggle
                active={viewMode === 'grid'}
                onClick={() => onViewModeChange('grid')}
                icon={<LayoutGrid size={13} />}
              />
              <ViewToggle
                active={viewMode === 'list'}
                onClick={() => onViewModeChange('list')}
                icon={<List size={13} />}
              />
            </div>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-10 text-white/40 text-sm">
          <Loader2 size={14} className="animate-spin text-neon-blue" />
          Carregando...
        </div>
      ) : error ? (
        <div className="flex items-center justify-center gap-2 py-10 text-neon-pink text-sm">
          <AlertCircle size={14} />
          Erro ao carregar
        </div>
      ) : !items || items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-white/30">
          {emptyIcon}
          <span className="text-xs">{emptyMessage}</span>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className={viewMode === 'grid' ? clsx('grid gap-3', gridCols) : 'space-y-2'}
          >
            {items.map((item) => {
              const k = getKey(item)
              const loading = loadingId === k
              const onClick = () => onItemClick?.(item)
              const ctx = { loading, onClick }
              return (
                <div key={k} className="relative">
                  {viewMode === 'grid' ? renderCard(item, ctx) : renderRow(item, ctx)}
                  {loading && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-dark-900/60 backdrop-blur-sm pointer-events-none">
                      <div className="flex items-center gap-2 text-neon-blue text-xs font-medium">
                        <Loader2 size={14} className="animate-spin" />
                        Abrindo...
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}

function ViewToggle({ active, onClick, icon }: { active: boolean; onClick: () => void; icon: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex items-center justify-center w-7 h-7 rounded-md transition-all',
        active ? 'bg-neon-blue/20 text-neon-blue' : 'text-white/40 hover:text-white/70 hover:bg-white/5'
      )}
    >
      {icon}
    </button>
  )
}
