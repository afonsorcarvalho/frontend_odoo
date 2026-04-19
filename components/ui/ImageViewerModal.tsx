'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'
import { useState, useEffect } from 'react'
import { clsx } from 'clsx'

interface ImageViewerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  src: string                 // data:image/...;base64,... OU URL
  title?: string
  filename?: string
}

export function ImageViewerModal({ open, onOpenChange, src, title, filename }: ImageViewerModalProps) {
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    if (open) setZoom(1)
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!open) return
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(z + 0.25, 4))
      if (e.key === '-' || e.key === '_') setZoom((z) => Math.max(z - 0.25, 0.5))
      if (e.key === '0') setZoom(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const handleDownload = () => {
    const a = document.createElement('a')
    a.href = src
    a.download = filename || 'image.png'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="fixed inset-0 z-50 flex flex-col pointer-events-none"
              >
                {/* Top toolbar */}
                <div className="flex items-center justify-between gap-3 px-4 py-3 bg-gradient-to-b from-dark-900/90 to-transparent pointer-events-auto">
                  <div className="min-w-0">
                    {title && (
                      <Dialog.Title className="text-sm font-semibold text-white truncate">
                        {title}
                      </Dialog.Title>
                    )}
                    {filename && (
                      <Dialog.Description className="text-[11px] text-white/50 font-mono truncate">
                        {filename}
                      </Dialog.Description>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <ToolButton
                      icon={<ZoomOut size={15} />}
                      onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                      title="Diminuir (-)"
                    />
                    <button
                      onClick={() => setZoom(1)}
                      title="Reset (0)"
                      className="px-2.5 py-1 rounded-lg text-xs font-mono bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all min-w-[52px]"
                    >
                      {Math.round(zoom * 100)}%
                    </button>
                    <ToolButton
                      icon={<ZoomIn size={15} />}
                      onClick={() => setZoom((z) => Math.min(z + 0.25, 4))}
                      title="Aumentar (+)"
                    />
                    <div className="w-px h-5 bg-white/10 mx-1" />
                    <ToolButton
                      icon={<Maximize2 size={15} />}
                      onClick={() => setZoom(1)}
                      title="Ajustar"
                    />
                    <ToolButton
                      icon={<Download size={15} />}
                      onClick={handleDownload}
                      title="Baixar"
                    />
                    <Dialog.Close asChild>
                      <ToolButton icon={<X size={15} />} title="Fechar (Esc)" danger />
                    </Dialog.Close>
                  </div>
                </div>

                {/* Image area */}
                <div
                  className="flex-1 overflow-auto pointer-events-auto"
                  onClick={() => onOpenChange(false)}
                >
                  <div className="min-h-full min-w-full flex items-center justify-center p-4">
                    <motion.img
                      src={src}
                      alt={title || 'Imagem'}
                      onClick={(e) => e.stopPropagation()}
                      draggable={false}
                      style={{ transform: `scale(${zoom})` }}
                      transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                      className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-[0_0_60px_rgba(0,212,255,0.15)] bg-white cursor-zoom-in select-none"
                    />
                  </div>
                </div>

                {/* Bottom hint */}
                <div className="px-4 py-2 bg-gradient-to-t from-dark-900/90 to-transparent pointer-events-auto text-center">
                  <span className="text-[10px] text-white/30 font-mono">
                    + / – para zoom  ·  0 para resetar  ·  Esc para fechar
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

function ToolButton({
  icon, onClick, title, danger,
}: { icon: React.ReactNode; onClick?: () => void; title: string; danger?: boolean }) {
  return (
    <motion.button
      onClick={onClick}
      title={title}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      className={clsx(
        'p-2 rounded-lg border transition-all',
        danger
          ? 'bg-neon-pink/5 border-neon-pink/20 text-neon-pink hover:bg-neon-pink/15'
          : 'bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10'
      )}
    >
      {icon}
    </motion.button>
  )
}
