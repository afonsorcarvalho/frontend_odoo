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
  'periodicity_ids',
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
}

export default osApi
