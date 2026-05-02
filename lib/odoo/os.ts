import odooClient, { OdooError } from './client'
import { useSchemaStore } from '../store/schemaStore'
import type {
  OdooOs,
  OdooOsSummary,
  OsFilters,
  OsFormData,
  OsState,
  Employee,
  HrDepartment,
  OsChecklistItem,
  OsRelatorio,
  OsRelatorioFormData,
  OsRequestPart,
  OsRequestPartFormData,
  OsPartState,
  OsProduct,
} from '../types/os'
import type { Equipment } from '../types/ciclo'

function fieldsFor(model: string, fields: string[]): string[] {
  return useSchemaStore.getState().filterFields(model, fields)
}

function assertCan(model: string, operation: 'write' | 'create' | 'unlink'): void {
  const store = useSchemaStore.getState()
  const fn = { write: store.canWrite, create: store.canCreate, unlink: store.canUnlink }[operation]
  if (!fn(model)) {
    const label = { write: 'modificar', create: 'criar', unlink: 'excluir' }[operation]
    throw new OdooError(`Você não tem permissão para ${label} registros de ${model}`, 403)
  }
}

export const OS_LIST_FIELDS: string[] = [
  'id', 'name', 'display_name', 'state', 'priority', 'kanban_state',
  'maintenance_type', 'who_executor',
  'equipment_id', 'equipment_apelido', 'equipment_tag',
  'equipment_model', 'equipment_serial_number', 'equipment_patrimonio', 'equipment_category',
  'client_id', 'solicitante', 'tecnico_id', 'department', 'empresa_manutencao',
  'date_request', 'date_scheduled', 'date_execution', 'date_start', 'date_finish',
  'maintenance_duration', 'is_warranty', 'warranty_type',
  'repaired', 'write_date',
]

export const OS_DETAIL_FIELDS: string[] = [
  ...OS_LIST_FIELDS,
  'problem_description', 'service_description', 'origin', 'sequence',
  'company_id', 'create_date', 'create_uid',
  'check_list_count', 'check_list_created',
  'calibration_id', 'calibration_created',
  'relatorios_count', 'request_parts_count',
  'request_id', 'request_service_id',
  'periodicity_ids', 'tecnico_aux_id',
  'signature', 'signature2', 'technician_signature_date', 'supervisor_signature_date',
]

export function buildOsDomain(filters: OsFilters, companyId?: number | null): unknown[] {
  const domain: unknown[] = []

  if (companyId && useSchemaStore.getState().hasField('engc.os', 'company_id')) {
    domain.push(['company_id', '=', companyId])
  }

  if (filters.search.trim()) {
    const s = filters.search.trim()
    domain.push(
      '|', '|', '|',
      ['name', 'ilike', s],
      ['solicitante', 'ilike', s],
      ['equipment_apelido', 'ilike', s],
      ['equipment_tag', 'ilike', s],
    )
  }

  if (filters.state) domain.push(['state', '=', filters.state])
  if (filters.maintenance_type) domain.push(['maintenance_type', '=', filters.maintenance_type])
  if (filters.equipment_id) domain.push(['equipment_id', '=', filters.equipment_id])
  if (filters.date_from) domain.push(['date_scheduled', '>=', filters.date_from])
  if (filters.date_to) domain.push(['date_scheduled', '<=', filters.date_to])

  if (filters.only_overdue) {
    // date_scheduled < now AND state NOT IN terminal
    const nowIso = new Date().toISOString().slice(0, 19).replace('T', ' ')
    domain.push(['date_scheduled', '<', nowIso])
    domain.push(['state', 'not in', ['done', 'cancel', 'reproved']])
  }

  if (filters.only_unsigned) {
    // signature OR signature2 vazia (false)
    domain.push('|', ['signature', '=', false], ['signature2', '=', false])
  }

  return domain
}

export const osApi = {
  async listPage(
    filters: OsFilters,
    pageParam = 0,
    pageSize = 24,
    companyId?: number | null
  ): Promise<{ records: OdooOsSummary[]; nextCursor: number | null; total: number }> {
    const domain = buildOsDomain(filters, companyId)

    const [records, total] = await Promise.all([
      odooClient.searchRead<OdooOsSummary>(
        'engc.os',
        domain,
        fieldsFor('engc.os', OS_LIST_FIELDS),
        { limit: pageSize, offset: pageParam, order: 'date_scheduled desc, id desc' }
      ),
      odooClient.searchCount('engc.os', domain),
    ])

    const nextCursor = pageParam + records.length < total ? pageParam + pageSize : null
    return { records, nextCursor, total }
  },

  async getById(id: number): Promise<OdooOs> {
    const records = await odooClient.read<OdooOs>(
      'engc.os',
      [id],
      fieldsFor('engc.os', OS_DETAIL_FIELDS)
    )
    if (!records?.length) throw new Error(`OS #${id} não encontrada`)
    return records[0]
  },

  async create(values: OsFormData): Promise<number> {
    assertCan('engc.os', 'create')
    return odooClient.create('engc.os', values as unknown as Record<string, unknown>)
  },

  async update(id: number, values: Partial<OsFormData>): Promise<boolean> {
    assertCan('engc.os', 'write')
    return odooClient.write('engc.os', [id], values as Record<string, unknown>)
  },

  /**
   * Executa um método action_* no server. Usado para transições que têm
   * workflow no Odoo (action_start_execution, action_repair_end, etc.).
   */
  async callAction(id: number, method: string): Promise<unknown> {
    assertCan('engc.os', 'write')
    return odooClient.callKw('engc.os', method, [[id]])
  },

  /**
   * Transição "livre" de state via write — usada para estados sem action dedicado
   * (cancel, pause_repair, pause_budget, reproved, etc.).
   */
  async setState(id: number, state: OsState): Promise<boolean> {
    assertCan('engc.os', 'write')
    return odooClient.write('engc.os', [id], { state })
  },

  async getEmployees(): Promise<Employee[]> {
    return odooClient.searchRead<Employee>(
      'hr.employee',
      [],
      fieldsFor('hr.employee', ['id', 'name', 'display_name']),
      { limit: 300, order: 'name asc' }
    )
  },

  async getDepartments(): Promise<HrDepartment[]> {
    return odooClient.searchRead<HrDepartment>(
      'hr.department',
      [],
      fieldsFor('hr.department', ['id', 'name', 'display_name']),
      { limit: 200, order: 'name asc' }
    )
  },

  async getEquipments(): Promise<Equipment[]> {
    return odooClient.searchRead<Equipment>(
      'engc.equipment',
      [],
      fieldsFor('engc.equipment', ['id', 'name', 'display_name']),
      { limit: 500, order: 'name asc' }
    )
  },

  // ─── Checklist ────────────────────────────────────────────

  async getChecklist(osId: number): Promise<OsChecklistItem[]> {
    return odooClient.searchRead<OsChecklistItem>(
      'engc.os.verify.checklist',
      [['os_id', '=', osId]],
      fieldsFor('engc.os.verify.checklist', [
        'id', 'os_id', 'section', 'instruction', 'check', 'sequence',
        'tem_medicao', 'medicao', 'magnitude', 'tipo_de_campo', 'observations', 'state',
        'relatorio_id',
      ]),
      { limit: 500, order: 'sequence asc' }
    )
  },

  async updateChecklistItem(id: number, vals: Partial<Pick<OsChecklistItem, 'check' | 'medicao' | 'observations'>>): Promise<boolean> {
    return odooClient.write('engc.os.verify.checklist', [id], vals as Record<string, unknown>)
  },

  async generateChecklist(osId: number): Promise<unknown> {
    return odooClient.callKw('engc.os', 'create_checklist', [[osId]])
  },

  // ─── Relatórios ───────────────────────────────────────────

  async getRelatorios(osId: number): Promise<OsRelatorio[]> {
    return odooClient.searchRead<OsRelatorio>(
      'engc.os.relatorios',
      [['os_id', '=', osId]],
      fieldsFor('engc.os.relatorios', [
        'id', 'name', 'state', 'os_id', 'report_type',
        'fault_description', 'service_summary', 'observations', 'pendency',
        'technicians', 'state_equipment', 'restriction_type',
        'data_atendimento', 'data_fim_atendimento', 'time_execution',
        'checklist_item_ids',
      ]),
      { limit: 200, order: 'id asc' }
    )
  },

  async createRelatorio(vals: OsRelatorioFormData): Promise<number> {
    assertCan('engc.os.relatorios', 'create')
    return odooClient.create('engc.os.relatorios', vals as unknown as Record<string, unknown>)
  },

  async updateRelatorio(id: number, vals: Partial<OsRelatorioFormData>): Promise<boolean> {
    assertCan('engc.os.relatorios', 'write')
    return odooClient.write('engc.os.relatorios', [id], vals as Record<string, unknown>)
  },

  async deleteRelatorio(id: number): Promise<boolean> {
    assertCan('engc.os.relatorios', 'unlink')
    return odooClient.unlink('engc.os.relatorios', [id])
  },

  async doneRelatorio(id: number): Promise<unknown> {
    return odooClient.callKw('engc.os.relatorios', 'action_done', [[id]])
  },

  async cancelRelatorio(id: number): Promise<unknown> {
    return odooClient.callKw('engc.os.relatorios', 'action_cancel', [[id]])
  },

  // ─── Peças ────────────────────────────────────────────────

  async getParts(osId: number): Promise<OsRequestPart[]> {
    return odooClient.searchRead<OsRequestPart>(
      'engc.os.request.parts',
      [['os_id', '=', osId]],
      fieldsFor('engc.os.request.parts', [
        'id', 'os_id', 'state', 'product_id',
        'product_uom_qty', 'product_uom',
        'relatorio_request_id', 'relatorio_application_id',
      ]),
      { limit: 200, order: 'id asc' }
    )
  },

  async createPart(vals: OsRequestPartFormData): Promise<number> {
    assertCan('engc.os.request.parts', 'create')
    return odooClient.create('engc.os.request.parts', vals as unknown as Record<string, unknown>)
  },

  async updatePartState(id: number, state: OsPartState): Promise<boolean> {
    assertCan('engc.os.request.parts', 'write')
    return odooClient.write('engc.os.request.parts', [id], { state })
  },

  async deletePart(id: number): Promise<boolean> {
    assertCan('engc.os.request.parts', 'unlink')
    return odooClient.unlink('engc.os.request.parts', [id])
  },

  async applyPartToRelatorio(partId: number, relatorioId: number): Promise<boolean> {
    assertCan('engc.os.request.parts', 'write')
    return odooClient.write('engc.os.request.parts', [partId], {
      relatorio_application_id: relatorioId,
      state: 'aplicada',
    })
  },

  // ─── Produtos (selector) ──────────────────────────────────

  async getProducts(search = ''): Promise<OsProduct[]> {
    const domain: unknown[] = [['sale_ok', '=', true]]
    if (search.trim()) domain.push(['name', 'ilike', search.trim()])
    return odooClient.searchRead<OsProduct>(
      'product.product',
      domain,
      fieldsFor('product.product', ['id', 'name', 'display_name', 'uom_id']),
      { limit: 100, order: 'name asc' }
    )
  },

  // ─── Parceiros (empresa_manutencao / client_id) ───────────

  async getPeriodicityNames(ids: number[]): Promise<{ id: number; name: string }[]> {
    if (!ids || ids.length === 0) return []
    return odooClient.read<{ id: number; name: string }>(
      'engc.maintenance_plan.periodicity',
      ids,
      ['id', 'name']
    )
  },

  async getPartners(filter: 'company' | 'all' = 'all'): Promise<{ id: number; name: string }[]> {
    const domain: unknown[] = filter === 'company' ? [['is_company', '=', true]] : []
    return odooClient.searchRead<{ id: number; name: string }>(
      'res.partner',
      domain,
      ['id', 'name'],
      { limit: 200, order: 'name asc' }
    )
  },
}

export default osApi
