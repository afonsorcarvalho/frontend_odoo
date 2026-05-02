'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Plus, Trash2, Upload, ImageIcon, Pencil, Check, X } from 'lucide-react'
import { GlassCard } from '@/components/ui/GlassCard'
import { ImageViewerModal } from '@/components/ui/ImageViewerModal'
import { useCicloFotos, useAddCicloFoto, useDeleteCicloFoto, useUpdateCicloFoto } from '@/lib/hooks/useCiclos'
import { useCiclosPermissions } from '@/lib/hooks/useCiclosPermissions'
import type { CicloFoto } from '@/lib/types/ciclo'

interface FotosSectionProps {
  cycleId: number
  delay?: number
}

function fotoUrl(id: number) {
  return `/api/odoo/web/image/afr.ciclo.fotos/${id}/imagem`
}

export function FotosSection({ cycleId, delay = 0 }: FotosSectionProps) {
  const { canWrite } = useCiclosPermissions()
  const { data: fotos = [], isLoading } = useCicloFotos(cycleId)
  const addMutation = useAddCicloFoto(cycleId, () => resetUpload())
  const deleteMutation = useDeleteCicloFoto(cycleId)
  const updateMutation = useUpdateCicloFoto(cycleId)

  const [showUpload, setShowUpload] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [legenda, setLegenda] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerFoto, setViewerFoto] = useState<CicloFoto | null>(null)

  const resetUpload = () => {
    setShowUpload(false)
    setTitulo('')
    setLegenda('')
    setFile(null)
    setPreview(null)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    if (!titulo) setTitulo(f.name.replace(/\.[^.]+$/, ''))
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !titulo.trim()) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string
      const base64 = dataUrl.split(',')[1]
      addMutation.mutate({
        titulo: titulo.trim(),
        imagem: base64,
        nome_arquivo: file.name,
        legenda: legenda.trim() || undefined,
      })
    }
    reader.readAsDataURL(file)
  }

  const handleDelete = (foto: CicloFoto) => {
    if (!window.confirm(`Remover foto "${foto.titulo}"?`)) return
    deleteMutation.mutate(foto.id)
  }

  const openViewer = (foto: CicloFoto) => {
    setViewerFoto(foto)
    setViewerOpen(true)
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="md:col-span-2"
      >
        <GlassCard>
          <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Camera size={14} className="text-neon-blue" />
              <h3 className="text-sm font-semibold text-white">
                Fotos
                {fotos.length > 0 && (
                  <span className="ml-1.5 text-white/40 font-normal text-xs">({fotos.length})</span>
                )}
              </h3>
            </div>
            {canWrite && (
              <button
                onClick={() => setShowUpload((v) => !v)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                  showUpload
                    ? 'border-neon-blue/50 bg-neon-blue/15 text-neon-blue'
                    : 'border-neon-blue/30 bg-neon-blue/5 text-neon-blue hover:bg-neon-blue/10 hover:border-neon-blue/50'
                }`}
              >
                <Plus size={11} /> Adicionar
              </button>
            )}
          </div>

          {/* Upload form */}
          <AnimatePresence>
            {showUpload && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mb-4"
              >
                <form
                  onSubmit={handleSubmit}
                  className="rounded-xl border border-neon-blue/20 bg-neon-blue/5 p-4 space-y-3"
                >
                  <p className="text-xs font-semibold text-neon-blue">Nova foto</p>

                  {/* File drop zone */}
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className={`w-full rounded-xl border-2 border-dashed transition-all overflow-hidden ${
                      preview
                        ? 'border-neon-blue/30 p-0'
                        : 'border-white/10 hover:border-neon-blue/30 p-6 flex flex-col items-center gap-2'
                    }`}
                  >
                    {preview ? (
                      <img src={preview} alt="preview" className="w-full max-h-48 object-contain bg-black/20" />
                    ) : (
                      <>
                        <Upload size={20} className="text-white/30" />
                        <span className="text-xs text-white/40">Clique para selecionar imagem</span>
                      </>
                    )}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs text-white/50 mb-1 block">Título *</label>
                      <input
                        type="text"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        placeholder="Título da foto"
                        className="w-full px-3 py-2 rounded-xl text-sm bg-white/[0.04] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-neon-blue/40"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-white/50 mb-1 block">Legenda</label>
                      <input
                        type="text"
                        value={legenda}
                        onChange={(e) => setLegenda(e.target.value)}
                        placeholder="Opcional"
                        className="w-full px-3 py-2 rounded-xl text-sm bg-white/[0.04] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-neon-blue/40"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={resetUpload}
                      className="px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/10 transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!file || !titulo.trim() || addMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neon-blue border border-neon-blue/30 bg-neon-blue/10 hover:bg-neon-blue/20 transition-all disabled:opacity-50"
                    >
                      <Upload size={11} />
                      {addMutation.isPending ? 'Enviando...' : 'Enviar'}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Grid de fotos */}
          {isLoading ? (
            <div className="text-xs text-white/40 py-4 text-center">Carregando...</div>
          ) : fotos.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-white/25">
              <ImageIcon size={28} />
              <span className="text-xs">Nenhuma foto</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {fotos.map((foto) => (
                <FotoCard
                  key={foto.id}
                  foto={foto}
                  canWrite={canWrite}
                  onOpen={() => openViewer(foto)}
                  onDelete={() => handleDelete(foto)}
                  isDeleting={deleteMutation.isPending}
                  onSave={(data) => updateMutation.mutate({ id: foto.id, data })}
                  isSaving={updateMutation.isPending}
                />
              ))}
            </div>
          )}
        </GlassCard>
      </motion.div>

      <ImageViewerModal
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        src={viewerFoto ? fotoUrl(viewerFoto.id) : ''}
        title={viewerFoto?.titulo}
        filename={viewerFoto?.nome_arquivo || viewerFoto?.titulo || 'foto.jpg'}
      />
    </>
  )
}

function FotoCard({
  foto,
  canWrite,
  onOpen,
  onDelete,
  isDeleting,
  onSave,
  isSaving,
}: {
  foto: CicloFoto
  canWrite: boolean
  onOpen: () => void
  onDelete: () => void
  isDeleting: boolean
  onSave: (data: { titulo?: string; legenda?: string }) => void
  isSaving: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [editTitulo, setEditTitulo] = useState(foto.titulo)
  const [editLegenda, setEditLegenda] = useState(foto.legenda || '')

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditTitulo(foto.titulo)
    setEditLegenda(foto.legenda || '')
    setEditing(true)
  }

  const cancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditing(false)
  }

  const submitEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!editTitulo.trim()) return
    onSave({ titulo: editTitulo.trim(), legenda: editLegenda.trim() || undefined })
    setEditing(false)
  }

  return (
    <div className="group relative rounded-xl overflow-hidden border border-white/10 bg-white/[0.03]">
      {/* Imagem */}
      <div className="aspect-square overflow-hidden cursor-pointer" onClick={onOpen}>
        <img
          src={fotoUrl(foto.id)}
          alt={foto.titulo}
          loading="lazy"
          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-200"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      </div>

      {/* Acções hover (topo direito) */}
      {canWrite && !editing && (
        <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={startEdit}
            className="p-1 rounded-lg bg-black/60 text-white/60 hover:text-neon-blue hover:bg-black/80 transition-all"
            title="Editar"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            disabled={isDeleting}
            className="p-1 rounded-lg bg-black/60 text-white/60 hover:text-red-400 hover:bg-black/80 transition-all disabled:opacity-50"
            title="Remover"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}

      {/* Info / edição */}
      <AnimatePresence mode="wait">
        {editing ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="px-2 pt-2 pb-2 space-y-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              value={editTitulo}
              onChange={(e) => setEditTitulo(e.target.value)}
              placeholder="Título"
              className="w-full px-2 py-1 rounded-lg text-[11px] bg-white/[0.06] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-neon-blue/40"
            />
            <input
              value={editLegenda}
              onChange={(e) => setEditLegenda(e.target.value)}
              placeholder="Legenda (opcional)"
              className="w-full px-2 py-1 rounded-lg text-[11px] bg-white/[0.06] border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-neon-blue/40"
            />
            <div className="flex justify-end gap-1">
              <button
                onClick={cancelEdit}
                className="p-1 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-all"
              >
                <X size={11} />
              </button>
              <button
                onClick={submitEdit}
                disabled={!editTitulo.trim() || isSaving}
                className="p-1 rounded-md text-neon-blue hover:bg-neon-blue/10 transition-all disabled:opacity-50"
              >
                <Check size={11} />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="info"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="px-2 py-1.5"
          >
            <p className="text-[11px] text-white/70 truncate" title={foto.titulo}>{foto.titulo}</p>
            {foto.legenda && (
              <p className="text-[10px] text-white/40 truncate" title={foto.legenda}>{foto.legenda}</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
