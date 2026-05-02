'use client'

import { useRef, useState, useEffect, ChangeEvent, MouseEvent, TouchEvent } from 'react'
import { useEscapeKey } from '@/lib/hooks/useEscapeKey'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { clsx } from 'clsx'
import { X, PenTool, Upload, Wand2, Trash2, Check, Image as ImageIcon } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { AnimatedButton } from './AnimatedButton'
import { ActionButton } from './ActionButton'

type Mode = 'draw' | 'upload' | 'auto'

interface SignatureCaptureProps {
  open: boolean
  onClose: () => void
  /** Salva assinatura. Recebe base64 puro (sem prefixo data:). null = remover */
  onSave: (base64: string | null) => void | Promise<void>
  title?: string
  /** Nome default para modo automática (ex: nome do técnico/usuário) */
  defaultName?: string
  /** Assinatura atual (base64 puro) para pré-visualização */
  currentValue?: string | null
  pending?: boolean
}

const CANVAS_W = 600
const CANVAS_H = 220
const INK_COLOR = '#1d4ed8'   // azul caneta
const PAPER_COLOR = '#ffffff' // fundo branco

export function SignatureCapture({
  open, onClose, onSave, title = 'Assinatura',
  defaultName = '', currentValue, pending,
}: SignatureCaptureProps) {
  const [mode, setMode] = useState<Mode>('draw')
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  useEscapeKey(open, onClose)

  // Draw state
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [hasDrawing, setHasDrawing] = useState(false)

  // Upload state
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)

  // Auto state
  const [autoName, setAutoName] = useState<string>(defaultName)
  const autoCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (open) {
      setMode('draw')
      setHasDrawing(false)
      setUploadPreview(null)
      setAutoName(defaultName)
      // Limpa canvas após render (garante fundo branco)
      setTimeout(() => clearCanvas(), 0)
    }
  }, [open, defaultName])

  // Garante fundo branco ao montar o canvas de desenho (inclusive ao trocar de aba)
  useEffect(() => {
    if (mode === 'draw' && open) {
      setTimeout(() => clearCanvas(), 0)
      setHasDrawing(false)
    }
  }, [mode, open])

  useEffect(() => {
    if (mode === 'auto' && open) {
      renderAutoSignature(autoName)
    }
  }, [mode, autoName, open])

  // ─── Canvas desenho ──────────────────────────────────────
  const getCtx = () => canvasRef.current?.getContext('2d') ?? null

  const clearCanvas = () => {
    const ctx = getCtx()
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    ctx.fillStyle = PAPER_COLOR
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    setHasDrawing(false)
  }

  const getPos = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      const t = e.touches[0]
      return { x: (t.clientX - rect.left) * scaleX, y: (t.clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  const startDraw = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const ctx = getCtx()
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.strokeStyle = INK_COLOR
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
    setDrawing(true)
  }

  const moveDraw = (e: MouseEvent<HTMLCanvasElement> | TouchEvent<HTMLCanvasElement>) => {
    if (!drawing) return
    e.preventDefault()
    const ctx = getCtx()
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    setHasDrawing(true)
  }

  const endDraw = () => setDrawing(false)

  // ─── Upload ──────────────────────────────────────────────
  const handleUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setUploadPreview(result)
    }
    reader.readAsDataURL(file)
  }

  // ─── Assinatura automática (renderiza nome em fonte cursiva) ────
  const renderAutoSignature = (name: string) => {
    const canvas = autoCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    // Fundo transparente — exportação PNG fica sem bg
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (!name.trim()) return
    // Tinta azul
    ctx.fillStyle = INK_COLOR
    let fontSize = 72
    ctx.font = `italic ${fontSize}px "Brush Script MT", "Segoe Script", cursive, serif`
    while (ctx.measureText(name).width > canvas.width - 40 && fontSize > 24) {
      fontSize -= 4
      ctx.font = `italic ${fontSize}px "Brush Script MT", "Segoe Script", cursive, serif`
    }
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText(name, canvas.width / 2, canvas.height / 2)
    // Linha abaixo, azul translúcida
    ctx.strokeStyle = 'rgba(29, 78, 216, 0.3)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(40, canvas.height - 30)
    ctx.lineTo(canvas.width - 40, canvas.height - 30)
    ctx.stroke()
  }

  // ─── Save ────────────────────────────────────────────────
  const extractBase64 = (dataUrl: string): string => {
    const idx = dataUrl.indexOf(',')
    return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl
  }

  const handleSave = async () => {
    let dataUrl: string | null = null
    if (mode === 'draw') {
      if (!hasDrawing || !canvasRef.current) return
      dataUrl = canvasRef.current.toDataURL('image/png')
    } else if (mode === 'upload') {
      if (!uploadPreview) return
      dataUrl = uploadPreview
    } else if (mode === 'auto') {
      if (!autoName.trim() || !autoCanvasRef.current) return
      dataUrl = autoCanvasRef.current.toDataURL('image/png')
    }
    if (!dataUrl) return
    await onSave(extractBase64(dataUrl))
  }

  const handleRemove = async () => {
    await onSave(null)
  }

  if (!mounted) return null

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="w-full max-w-2xl"
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <PenTool size={16} className="text-neon-blue" />
                  <h2 className="text-base font-semibold text-white">{title}</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-white/5 border border-white/10 mb-4">
                <TabBtn active={mode === 'draw'} onClick={() => setMode('draw')} icon={<PenTool size={13} />} label="Desenhar" />
                <TabBtn active={mode === 'upload'} onClick={() => setMode('upload')} icon={<Upload size={13} />} label="Carregar" />
                <TabBtn active={mode === 'auto'} onClick={() => setMode('auto')} icon={<Wand2 size={13} />} label="Automática" />
              </div>

              {/* Panels */}
              {mode === 'draw' && (
                <div className="space-y-3">
                  <div className="rounded-xl border border-white/10 bg-white overflow-hidden relative">
                    <canvas
                      ref={canvasRef}
                      width={CANVAS_W}
                      height={CANVAS_H}
                      onMouseDown={startDraw}
                      onMouseMove={moveDraw}
                      onMouseUp={endDraw}
                      onMouseLeave={endDraw}
                      onTouchStart={startDraw}
                      onTouchMove={moveDraw}
                      onTouchEnd={endDraw}
                      className="w-full cursor-crosshair touch-none block bg-white"
                      style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
                    />
                    {!hasDrawing && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-xs">
                        Desenhe sua assinatura aqui
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/60 hover:text-neon-pink hover:bg-neon-pink/10 transition-all"
                    >
                      <Trash2 size={12} /> Limpar
                    </button>
                    <p className="text-[11px] text-white/40">Use mouse ou toque para desenhar</p>
                  </div>
                </div>
              )}

              {mode === 'upload' && (
                <div className="space-y-3">
                  <label className="block rounded-xl border-2 border-dashed border-white/15 bg-white/[0.02] hover:border-neon-blue/40 hover:bg-white/[0.04] transition-all cursor-pointer p-8 text-center">
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleUpload}
                      className="hidden"
                    />
                    <ImageIcon size={32} className="mx-auto text-neon-blue/60 mb-2" />
                    <p className="text-sm text-white/70">
                      {uploadPreview ? 'Trocar imagem' : 'Clique para selecionar imagem'}
                    </p>
                    <p className="text-[11px] text-white/40 mt-1">PNG ou JPG</p>
                  </label>
                  {uploadPreview && (
                    <div className="rounded-xl border border-white/10 bg-white p-4 flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={uploadPreview}
                        alt="Pré-visualização"
                        className="max-h-40 object-contain"
                      />
                    </div>
                  )}
                </div>
              )}

              {mode === 'auto' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-white/50 mb-1 block">Nome</label>
                    <input
                      type="text"
                      value={autoName}
                      onChange={(e) => setAutoName(e.target.value)}
                      placeholder="Digite o nome completo"
                      className="w-full px-3 py-2 rounded-xl text-sm bg-white/[0.04] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-neon-blue/40"
                    />
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white overflow-hidden">
                    <canvas
                      ref={autoCanvasRef}
                      width={CANVAS_W}
                      height={CANVAS_H}
                      className="w-full block bg-white"
                      style={{ aspectRatio: `${CANVAS_W} / ${CANVAS_H}` }}
                    />
                  </div>
                  <p className="text-[11px] text-white/40 text-center">Assinatura gerada em fonte cursiva</p>
                </div>
              )}

              {currentValue && (
                <div className="mt-4">
                  <p className="text-[10px] uppercase tracking-wide text-white/40 mb-2">Assinatura atual</p>
                  <div className="p-3 rounded-xl bg-white border border-white/10 flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`data:image/png;base64,${currentValue}`}
                      alt="Assinatura atual"
                      className="max-h-24 object-contain"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-white/10">
                <div>
                  {currentValue && (
                    <ActionButton
                      variant="danger"
                      icon={<Trash2 size={13} />}
                      onAction={handleRemove}
                      pending={pending}
                      loadingText="Removendo..."
                    >
                      Remover
                    </ActionButton>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <AnimatedButton variant="ghost" onClick={onClose}>Cancelar</AnimatedButton>
                  <ActionButton
                    variant="neon"
                    icon={<Check size={13} />}
                    onAction={handleSave}
                    pending={pending}
                    loadingText="Salvando..."
                    disabled={
                      (mode === 'draw' && !hasDrawing) ||
                      (mode === 'upload' && !uploadPreview) ||
                      (mode === 'auto' && !autoName.trim())
                    }
                  >
                    Salvar Assinatura
                  </ActionButton>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(content, document.body)
}

function TabBtn({
  active, onClick, icon, label,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex-1 flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
        active
          ? 'bg-neon-blue/20 text-neon-blue border border-neon-blue/30'
          : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
      )}
    >
      {icon}
      {label}
    </button>
  )
}
