'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, X } from 'lucide-react'

export interface ComboboxOption {
  value: string
  label: string
  sublabel?: string
  warn?: string
}

interface ComboboxProps {
  options: ComboboxOption[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  emptyLabel?: string
  className?: string
  disabled?: boolean
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Selecionar...',
  emptyLabel = '— Nenhum —',
  className = '',
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const portalRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})

  const selectedOption = options.find((o) => o.value === value)

  const filtered = query.trim()
    ? options.filter(
        (o) =>
          o.label.toLowerCase().includes(query.toLowerCase()) ||
          o.sublabel?.toLowerCase().includes(query.toLowerCase())
      )
    : options

  const allOptions: ComboboxOption[] = [{ value: '', label: emptyLabel }, ...filtered]

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top

    if (spaceBelow >= 200 || spaceBelow >= spaceAbove) {
      setDropdownStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      })
    } else {
      setDropdownStyle({
        position: 'fixed',
        bottom: window.innerHeight - rect.top + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      })
    }
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition])

  // Scroll highlighted into view
  useEffect(() => {
    if (!open || !listRef.current) return
    const items = listRef.current.querySelectorAll<HTMLElement>('[data-option]')
    items[highlighted]?.scrollIntoView({ block: 'nearest' })
  }, [highlighted, open])

  // Click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        !containerRef.current?.contains(target) &&
        !portalRef.current?.contains(target)
      ) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const openDropdown = () => {
    if (disabled) return
    setQuery('')
    const idx = options.findIndex((o) => o.value === value)
    setHighlighted(idx >= 0 ? idx + 1 : 0)
    setOpen(true)
    updatePosition()
  }

  const closeDropdown = () => {
    setOpen(false)
    setQuery('')
  }

  const selectOption = (v: string) => {
    onChange(v)
    closeDropdown()
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        openDropdown()
      }
      return
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlighted((h) => Math.min(h + 1, allOptions.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlighted((h) => Math.max(h - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (allOptions[highlighted]) selectOption(allOptions[highlighted].value)
        break
      case 'Escape':
        e.preventDefault()
        closeDropdown()
        break
      case 'Tab':
        closeDropdown()
        break
    }
  }

  const baseCls = `w-full pl-3 pr-14 py-2 rounded-xl text-sm bg-white/[0.04] border text-white placeholder:text-white/30 focus:outline-none transition-colors ${
    open ? 'border-neon-blue/40' : 'border-white/10 hover:border-white/20'
  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`

  const displayValue = open ? query : (selectedOption?.label ?? '')

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        type="text"
        value={displayValue}
        placeholder={open ? 'Buscar...' : placeholder}
        onChange={(e) => {
          setQuery(e.target.value)
          setHighlighted(0)
        }}
        onFocus={openDropdown}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={baseCls}
        autoComplete="off"
        spellCheck={false}
      />

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
        {value && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => {
              e.preventDefault()
              onChange('')
              setQuery('')
            }}
            className="pointer-events-auto p-0.5 rounded text-white/30 hover:text-white/60 transition-colors"
          >
            <X size={12} />
          </button>
        )}
        <ChevronDown
          size={14}
          className={`text-white/30 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </div>

      {open &&
        typeof window !== 'undefined' &&
        createPortal(
          <div
            ref={portalRef}
            style={dropdownStyle}
            className="rounded-xl border border-white/10 bg-dark-800/95 backdrop-blur-xl shadow-glass-lg overflow-hidden"
          >
            <div ref={listRef} className="max-h-60 overflow-y-auto py-1">
              {allOptions.length === 0 ? (
                <div className="px-3 py-2 text-sm text-white/40">Nenhum resultado</div>
              ) : (
                allOptions.map((opt, idx) => (
                  <button
                    key={opt.value === '' ? '__none__' : opt.value}
                    data-option
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault()
                      selectOption(opt.value)
                    }}
                    onMouseEnter={() => setHighlighted(idx)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                      idx === highlighted
                        ? 'bg-neon-blue/10 text-white'
                        : 'text-white/70 hover:bg-white/[0.04] hover:text-white'
                    }`}
                  >
                    <span
                      className={`flex-shrink-0 w-4 ${
                        opt.value === value ? 'text-neon-blue' : 'text-transparent'
                      }`}
                    >
                      <Check size={12} />
                    </span>
                    <span className="flex-1 min-w-0 truncate">
                      <span className={opt.value === '' ? 'text-white/40 italic' : ''}>
                        {opt.label}
                      </span>
                      {opt.sublabel && (
                        <span className="text-white/40 text-xs ml-1.5">{opt.sublabel}</span>
                      )}
                    </span>
                    {opt.warn && (
                      <span className="text-xs text-neon-orange flex-shrink-0">{opt.warn}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
