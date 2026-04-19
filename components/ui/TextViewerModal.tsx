'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, Search, ChevronUp, ChevronDown, FileText, Loader2, CaseSensitive } from 'lucide-react'
import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import { clsx } from 'clsx'

interface TextViewerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  content: string | null              // null = carregando
  title?: string
  filename?: string
  onDownload?: () => void
  isLoading?: boolean
}

export function TextViewerModal({
  open, onOpenChange, content, title, filename, onDownload, isLoading,
}: TextViewerModalProps) {
  const [query, setQuery] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [activeMatch, setActiveMatch] = useState(0)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const activeLineRef = useRef<HTMLDivElement>(null)

  const lines = useMemo(() => (content ?? '').split('\n'), [content])

  // Índices das linhas que contêm o termo buscado
  const matches = useMemo(() => {
    if (!query.trim()) return []
    const needle = caseSensitive ? query : query.toLowerCase()
    const result: number[] = []
    for (let i = 0; i < lines.length; i++) {
      const hay = caseSensitive ? lines[i] : lines[i].toLowerCase()
      if (hay.includes(needle)) result.push(i)
    }
    return result
  }, [query, caseSensitive, lines])

  // Reset activeMatch quando o termo muda
  useEffect(() => {
    setActiveMatch(0)
  }, [query, caseSensitive])

  // Reset ao abrir
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveMatch(0)
      setTimeout(() => searchInputRef.current?.focus(), 120)
    }
  }, [open])

  // Scroll para match ativo
  useEffect(() => {
    if (matches.length === 0) return
    const node = activeLineRef.current
    if (node) {
      node.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [activeMatch, matches])

  const goNext = useCallback(() => {
    if (matches.length === 0) return
    setActiveMatch((i) => (i + 1) % matches.length)
  }, [matches.length])

  const goPrev = useCallback(() => {
    if (matches.length === 0) return
    setActiveMatch((i) => (i - 1 + matches.length) % matches.length)
  }, [matches.length])

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (e.shiftKey) goPrev()
      else goNext()
    } else if (e.key === 'Escape') {
      setQuery('')
    }
  }

  const activeLineIndex = matches.length > 0 ? matches[activeMatch] : -1
  const totalLines = lines.length

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, scale: 0.97, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: 10 }}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                className="fixed inset-4 md:inset-8 lg:inset-x-[8%] lg:inset-y-10 z-50 flex flex-col rounded-2xl border border-white/10 bg-dark-900/95 backdrop-blur-2xl shadow-glass-lg overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-blue/40 to-transparent pointer-events-none" />

                {/* Header */}
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/10">
                  <div className="p-2 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex-shrink-0">
                    <FileText size={16} className="text-neon-blue" />
                  </div>
                  <div className="flex-1 min-w-0">
                    {title && (
                      <Dialog.Title className="text-sm font-semibold text-white truncate">
                        {title}
                      </Dialog.Title>
                    )}
                    {filename && (
                      <Dialog.Description className="text-[11px] text-white/40 font-mono truncate">
                        {filename} · {totalLines.toLocaleString('pt-BR')} linhas
                      </Dialog.Description>
                    )}
                  </div>

                  {onDownload && (
                    <motion.button
                      onClick={onDownload}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Baixar arquivo"
                      className="p-2 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <Download size={15} />
                    </motion.button>
                  )}
                  <Dialog.Close asChild>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title="Fechar (Esc)"
                      className="p-2 rounded-lg bg-neon-pink/5 border border-neon-pink/20 text-neon-pink hover:bg-neon-pink/15 transition-all"
                    >
                      <X size={15} />
                    </motion.button>
                  </Dialog.Close>
                </div>

                {/* Search bar */}
                <div className="flex items-center gap-2 px-5 py-2.5 border-b border-white/10 bg-white/[0.02]">
                  <div className="flex-1 relative flex items-center">
                    <Search size={14} className="absolute left-3 text-white/40 pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={handleKey}
                      placeholder="Buscar no arquivo..."
                      disabled={isLoading}
                      className="w-full pl-9 pr-4 py-2 rounded-lg text-sm bg-white/[0.04] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-neon-blue/40 focus:bg-white/[0.08] transition-all disabled:opacity-40"
                    />
                  </div>

                  <button
                    onClick={() => setCaseSensitive((v) => !v)}
                    title="Diferenciar maiúsculas/minúsculas"
                    className={clsx(
                      'p-2 rounded-lg border transition-all',
                      caseSensitive
                        ? 'bg-neon-blue/15 border-neon-blue/40 text-neon-blue'
                        : 'bg-white/[0.04] border-white/10 text-white/40 hover:text-white hover:bg-white/10'
                    )}
                  >
                    <CaseSensitive size={14} />
                  </button>

                  {query && (
                    <>
                      <span className="text-xs font-mono text-white/50 px-2 tabular-nums">
                        {matches.length > 0
                          ? `${activeMatch + 1}/${matches.length}`
                          : '0/0'}
                      </span>
                      <button
                        onClick={goPrev}
                        disabled={matches.length === 0}
                        title="Anterior (Shift+Enter)"
                        className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronUp size={14} />
                      </button>
                      <button
                        onClick={goNext}
                        disabled={matches.length === 0}
                        title="Próximo (Enter)"
                        className="p-2 rounded-lg bg-white/[0.04] border border-white/10 text-white/60 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                      >
                        <ChevronDown size={14} />
                      </button>
                    </>
                  )}
                </div>

                {/* Content */}
                <div
                  ref={scrollContainerRef}
                  className="flex-1 overflow-auto font-mono text-[12px] leading-[1.5] bg-dark-900"
                >
                  {isLoading || content === null ? (
                    <div className="h-full flex flex-col items-center justify-center gap-3 text-white/40 py-20">
                      <Loader2 size={24} className="animate-spin text-neon-blue" />
                      <span className="text-sm">Carregando conteúdo...</span>
                    </div>
                  ) : content === '' ? (
                    <div className="h-full flex items-center justify-center text-white/30 py-20">
                      Arquivo vazio
                    </div>
                  ) : (
                    <pre className="m-0 p-0">
                      {lines.map((line, i) => (
                        <LineRow
                          key={i}
                          index={i}
                          content={line}
                          isActive={i === activeLineIndex}
                          isMatch={matches.includes(i)}
                          query={query}
                          caseSensitive={caseSensitive}
                          lineRef={i === activeLineIndex ? activeLineRef : undefined}
                          totalLines={totalLines}
                        />
                      ))}
                    </pre>
                  )}
                </div>

                {/* Footer hints */}
                <div className="px-5 py-2 border-t border-white/5 text-center">
                  <span className="text-[10px] text-white/30 font-mono">
                    Enter = próximo · Shift+Enter = anterior · Esc = limpar busca/fechar
                  </span>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}

function LineRow({
  index, content, isActive, isMatch, query, caseSensitive, lineRef, totalLines,
}: {
  index: number
  content: string
  isActive: boolean
  isMatch: boolean
  query: string
  caseSensitive: boolean
  lineRef?: React.RefObject<HTMLDivElement>
  totalLines: number
}) {
  const lineNumber = index + 1
  const padding = String(totalLines).length
  const padded = String(lineNumber).padStart(padding, ' ')

  return (
    <div
      ref={lineRef}
      className={clsx(
        'flex items-start gap-0 transition-colors',
        isActive && 'bg-neon-blue/15',
        isMatch && !isActive && 'bg-neon-blue/[0.04]',
      )}
    >
      <span
        className={clsx(
          'select-none px-3 py-0.5 border-r border-white/5 text-right flex-shrink-0 tabular-nums whitespace-pre sticky left-0',
          isActive
            ? 'text-neon-blue bg-neon-blue/10'
            : isMatch
              ? 'text-neon-blue/60 bg-dark-900'
              : 'text-white/20 bg-dark-900'
        )}
      >
        {padded}
      </span>
      <span className="px-3 py-0.5 whitespace-pre text-white/80 flex-1">
        {query.trim() ? highlightMatches(content, query, caseSensitive) : content || ' '}
      </span>
    </div>
  )
}

function highlightMatches(text: string, query: string, caseSensitive: boolean): React.ReactNode {
  if (!query) return text
  const q = caseSensitive ? query : query.toLowerCase()
  const haystack = caseSensitive ? text : text.toLowerCase()

  const parts: React.ReactNode[] = []
  let lastIndex = 0
  let idx = haystack.indexOf(q)
  let key = 0
  while (idx !== -1) {
    if (idx > lastIndex) parts.push(text.slice(lastIndex, idx))
    parts.push(
      <mark key={key++} className="bg-neon-orange/40 text-white rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
    )
    lastIndex = idx + query.length
    idx = haystack.indexOf(q, lastIndex)
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}
