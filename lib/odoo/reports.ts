/**
 * Catálogo de reports Odoo indexados por model.
 *
 * Mantido manualmente a partir de docs/odoo-reports-*.md.
 * Para atualizar, rode: `node scripts/inspect-reports.mjs <model.name>`
 */

export interface OdooReport {
  report_name: string
  label: string
  filename_pattern?: string
}

export const REPORTS: Record<string, OdooReport[]> = {
  'afr.supervisorio.ciclos': [
    {
      report_name: 'afr_supervisorio_ciclos.report_ciclos_template',
      label: 'Impressão de Ciclo',
      filename_pattern: 'ciclo_{id}.pdf',
    },
    {
      report_name: 'afr_supervisorio_ciclos_extras.report_laudo_liberacao_template',
      label: 'Laudo de Liberação',
      filename_pattern: 'laudo_liberacao_{id}.pdf',
    },
  ],
}

export function getReportsFor(model: string): OdooReport[] {
  return REPORTS[model] ?? []
}

export function formatFilename(pattern: string | undefined, data: Record<string, string | number>): string {
  if (!pattern) return 'report.pdf'
  return pattern.replace(/\{(\w+)\}/g, (_, k) => String(data[k] ?? ''))
}
