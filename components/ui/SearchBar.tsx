'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Loader2 } from 'lucide-react'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { clsx } from 'clsx'

export interface SearchBarProps {
  /** Valor inicial (sincroniza uma vez ao montar). */
  initialValue?: string
  /** Disparado com o valor após debounce. */
  onSearch: (term: string) => void
  placeholder?: string
  /** Total de resultados para exibir no canto direito. Omita para esconder. */
  totalResults?: number
  /** Sufixo usado junto ao total. Ex.: n => `${n} ciclo${n !== 1 ? 's' : ''}`. */
  resultLabel?: (count: number) => string
  isLoading?: boolean
  /** Atalho Cmd/Ctrl+K foca o input. Default: true. */
  enableHotkey?: boolean
  /** Delay do debounce em ms. Default: 350. */
  debounceMs?: number
}

const defaultResultLabel = (n: number) => `${n.toLocaleString('pt-BR')} resultado${n !== 1 ? 's' : ''}`

export function SearchBar({
  initialValue = '',
  onSearch,
  placeholder = 'Buscar...',
  totalResults,
  resultLabel = defaultResultLabel,
  isLoading,
  enableHotkey = true,
  debounceMs = 350,
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(initialValue)
  const debouncedValue = useDebounce(localValue, debounceMs)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    onSearch(debouncedValue)
  }, [debouncedValue, onSearch])

  useEffect(() => {
    if (!enableHotkey) return
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [enableHotkey])

  const handleClear = () => {
    setLocalValue('')
    inputRef.current?.focus()
  }

  return (
    <div className="relative group">
      <div
        className={clsx(
          'absolute -inset-0.5 rounded-2xl blur transition-all duration-500',
          'bg-gradient-to-r from-neon-blue/0 via-neon-purple/0 to-neon-pink/0',
          'group-focus-within:from-neon-blue/20 group-focus-within:via-neon-purple/20 group-focus-within:to-neon-pink/20'
        )}
      />

      <div className="relative flex items-center">
        <div className="absolute left-4 text-white/40 group-focus-within:text-neon-blue transition-colors z-10">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 size={18} className="animate-spin" />
              </motion.div>
            ) : (
              <motion.div key="search" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Search size={18} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={placeholder}
          className={clsx(
            'w-full pl-11 pr-28 py-3.5 rounded-xl',
            'bg-white/[0.04] border border-white/10',
            'text-white placeholder-white/30 text-sm',
            'focus:outline-none focus:border-neon-blue/40 focus:bg-white/[0.06]',
            'transition-all duration-300 backdrop-blur-xl'
          )}
        />

        <div className="absolute right-10 flex items-center">
          <AnimatePresence>
            {totalResults !== undefined && (
              <motion.span
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="text-xs text-white/30"
              >
                {resultLabel(totalResults)}
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <div className="absolute right-3">
          <AnimatePresence mode="wait">
            {localValue ? (
              <motion.button
                key="clear"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                onClick={handleClear}
                className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={14} />
              </motion.button>
            ) : enableHotkey ? (
              <motion.kbd
                key="shortcut"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-[10px] text-white/20 border border-white/10 rounded px-1.5 py-0.5"
              >
                ⌘K
              </motion.kbd>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
