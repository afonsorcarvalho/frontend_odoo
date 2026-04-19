'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useContactsStore } from '@/lib/store/contactsStore'
import { ContactForm } from './ContactForm'

export function ContactFormModal() {
  const { ui, closeFormModal } = useContactsStore()
  const { isFormModalOpen, editingPartnerId } = ui

  return (
    <AnimatePresence>
      {isFormModalOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={closeFormModal}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto rounded-2xl border border-white/10 bg-dark-800/95 backdrop-blur-xl shadow-glass-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-blue/40 to-transparent" />

              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                  <h2 className="text-white font-semibold text-lg">
                    {editingPartnerId ? 'Editar contato' : 'Novo contato'}
                  </h2>
                  <p className="text-xs text-white/40 mt-0.5">
                    {editingPartnerId ? `Editando #${editingPartnerId}` : 'Preencha os dados do contato'}
                  </p>
                </div>
                <button
                  onClick={closeFormModal}
                  className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6">
                <ContactForm
                  partnerId={editingPartnerId}
                  onCancel={closeFormModal}
                />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
