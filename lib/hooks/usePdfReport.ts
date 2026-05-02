'use client'

import { useState } from 'react'
import toast from 'react-hot-toast'
import odooClient from '@/lib/odoo/client'
import { formatFilename } from '@/lib/odoo/reports'

/**
 * Hook reusável: gere state + fetch de PDF via report Odoo.
 * Cache por sourceKey evita re-fetch ao reabrir mesmo report.
 */
export function usePdfReport() {
  const [pdfOpen, setPdfOpen] = useState(false)
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [pdfServerFilename, setPdfServerFilename] = useState<string | undefined>()
  const [pdfTitle, setPdfTitle] = useState<string>('')
  const [pdfFallback, setPdfFallback] = useState<string>('')
  const [pdfSourceKey, setPdfSourceKey] = useState<string>('')

  async function openReport(
    reportName: string,
    ids: number[],
    label: string,
    filenamePattern: string | undefined,
    filenameData: Record<string, string | number>,
  ) {
    const key = `report:${reportName}|${ids.join(',')}`
    const fallback = formatFilename(filenamePattern, filenameData)
    setPdfTitle(`${label} · ${filenameData.name || filenameData.id}`)
    setPdfFallback(fallback)
    setPdfOpen(true)
    if (pdfSourceKey === key && pdfBlob !== null) return

    setPdfLoading(true)
    setPdfBlob(null)
    setPdfServerFilename(undefined)
    try {
      const { blob, filename } = await odooClient.fetchReportPdf(reportName, ids)
      setPdfBlob(blob)
      setPdfServerFilename(filename)
      setPdfSourceKey(key)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao gerar relatório')
      setPdfOpen(false)
    } finally {
      setPdfLoading(false)
    }
  }

  return {
    pdfOpen, setPdfOpen,
    pdfBlob, pdfLoading, pdfServerFilename, pdfTitle, pdfFallback,
    openReport,
  }
}
