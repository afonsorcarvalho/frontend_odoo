import odooClient from './client'
import { useSchemaStore } from '../store/schemaStore'
import type {
  OdooCycle,
  OdooCycleSummary,
  OdooCycleMaterial,
  CycleFilters,
  Equipment,
  CycleType,
  CycleFeatures,
  IBLote,
  IBFormData,
  IBLoteCreateData,
  MaterialCatalog,
  MaterialLineFormData,
  CicloFoto,
  CicloFotoCreateData,
} from '../types/ciclo'

function fieldsFor(model: string, fields: string[]): string[] {
  return useSchemaStore.getState().filterFields(model, fields)
}

export const CYCLE_LIST_FIELDS: string[] = [
  'id', 'name', 'display_name', 'state', 'start_date', 'end_date',
  'duration', 'duration_planned', 'batch_number', 'equipment_id', 'equipment_nickname',
  'cycle_type_id', 'cycle_features_id', 'operator_id', 'material_count', 'ib_resultado',
  'is_overdue', 'is_signed',
]

export const CYCLE_DETAIL_FIELDS: string[] = [
  ...CYCLE_LIST_FIELDS,
  'concentracao_eto_camara', 'concentracao_eto_porcentagem',
  'cycle_features_id', 'duration_planned', 'equipment_category_id',
  'ib_data_fim', 'ib_data_inicio', 'ib_lote', 'ib_marca', 'ib_modelo',
  'is_eto_equipment', 'massa_eto', 'massa_gas_eto', 'massa_gas_eto_setpoint',
  'notes', 'signature_date', 'signature_employee_id', 'signature_employee_name',
  'signature_professional_council', 'signature_professional_council_number',
  'company_id', 'create_date', 'create_uid',
  'cycle_pdf_filename', 'cycle_graph_filename', 'cycle_txt_filename', 'file_path',
  'cycle_graph', 'cycle_statistics_data',
]

export function buildCycleDomain(filters: CycleFilters, companyId?: number | null): unknown[] {
  const domain: unknown[] = []

  if (companyId && useSchemaStore.getState().hasField('afr.supervisorio.ciclos', 'company_id')) {
    domain.push(['company_id', '=', companyId])
  }

  if (filters.search.trim()) {
    const s = filters.search.trim()
    domain.push(
      '|', '|', '|',
      ['name', 'ilike', s],
      ['batch_number', 'ilike', s],
      ['equipment_nickname', 'ilike', s],
      ['equipment_id.name', 'ilike', s],
    )
  }

  if (filters.state) domain.push(['state', '=', filters.state])
  if (filters.equipment_id) domain.push(['equipment_id', '=', filters.equipment_id])
  if (filters.cycle_type_id) domain.push(['cycle_type_id', '=', filters.cycle_type_id])
  if (filters.only_overdue) domain.push(['is_overdue', '=', true])
  if (filters.only_signed) domain.push(['is_signed', '=', true])
  if (filters.date_from) domain.push(['start_date', '>=', filters.date_from])
  if (filters.date_to) domain.push(['start_date', '<=', filters.date_to])

  return domain
}

export const ciclosApi = {
  async listPage(
    filters: CycleFilters,
    pageParam = 0,
    pageSize = 24,
    companyId?: number | null
  ): Promise<{ records: OdooCycleSummary[]; nextCursor: number | null; total: number }> {
    const domain = buildCycleDomain(filters, companyId)

    const [records, total] = await Promise.all([
      odooClient.searchRead<OdooCycleSummary>(
        'afr.supervisorio.ciclos',
        domain,
        fieldsFor('afr.supervisorio.ciclos', CYCLE_LIST_FIELDS),
        { limit: pageSize, offset: pageParam, order: 'start_date desc, id desc' }
      ),
      odooClient.searchCount('afr.supervisorio.ciclos', domain),
    ])

    const nextCursor = pageParam + records.length < total ? pageParam + pageSize : null
    return { records, nextCursor, total }
  },

  async getById(id: number): Promise<OdooCycle> {
    const records = await odooClient.read<OdooCycle>(
      'afr.supervisorio.ciclos',
      [id],
      fieldsFor('afr.supervisorio.ciclos', CYCLE_DETAIL_FIELDS)
    )
    if (!records?.length) throw new Error(`Ciclo #${id} não encontrado`)
    return records[0]
  },

  async getEquipments(): Promise<Equipment[]> {
    return odooClient.searchRead<Equipment>(
      'engc.equipment',
      [],
      fieldsFor('engc.equipment', ['id', 'name', 'display_name']),
      { limit: 300, order: 'name asc' }
    )
  },

  async getCycleTypes(): Promise<CycleType[]> {
    return odooClient.searchRead<CycleType>(
      'afr.cycle.type',
      [],
      fieldsFor('afr.cycle.type', ['id', 'name', 'display_name']),
      { limit: 200, order: 'name asc' }
    )
  },

  async getCycleFeatures(): Promise<CycleFeatures[]> {
    return odooClient.searchRead<CycleFeatures>(
      'afr.cycle.features',
      [],
      fieldsFor('afr.cycle.features', [
        'id', 'name', 'display_name', 'cycle_type_id', 'phases_planned',
      ]),
      { limit: 500, order: 'name asc' }
    )
  },

  async getMaterialsForCycle(cycleId: number): Promise<OdooCycleMaterial[]> {
    return odooClient.searchRead<OdooCycleMaterial>(
      'afr.supervisorio.cycle.materials.lines',
      [['ciclo_id', '=', cycleId]],
      fieldsFor('afr.supervisorio.cycle.materials.lines', [
        'id', 'material_id', 'material_descricao',
        'fabricante_id', 'fabricante_nome',
        'lote', 'quantidade', 'unidade', 'validade',
      ]),
      { limit: 500, order: 'id asc' }
    )
  },

  async getIBLotes(): Promise<IBLote[]> {
    return odooClient.searchRead<IBLote>(
      'afr.indicador.biologico',
      [],
      fieldsFor('afr.indicador.biologico', ['id', 'name', 'marca', 'modelo', 'data_validade', 'vencido']),
      { limit: 500, order: 'name asc' }
    )
  },

  async createIBLote(data: IBLoteCreateData): Promise<number> {
    return odooClient.create('afr.indicador.biologico', data as unknown as Record<string, unknown>)
  },

  async updateIB(cycleId: number, data: IBFormData): Promise<boolean> {
    return odooClient.write('afr.supervisorio.ciclos', [cycleId], data as unknown as Record<string, unknown>)
  },

  async getMaterialsCatalog(): Promise<MaterialCatalog[]> {
    return odooClient.searchRead<MaterialCatalog>(
      'afr.supervisorio.materials',
      [['active', '=', true]],
      fieldsFor('afr.supervisorio.materials', ['id', 'descricao', 'fabricante_id', 'fabricante_nome']),
      { limit: 1000, order: 'descricao asc' }
    )
  },

  async addMaterialLine(cycleId: number, data: MaterialLineFormData): Promise<number> {
    return odooClient.create('afr.supervisorio.cycle.materials.lines', {
      ciclo_id: cycleId,
      ...data,
    })
  },

  async updateMaterialLine(lineId: number, data: Partial<MaterialLineFormData>): Promise<boolean> {
    return odooClient.write('afr.supervisorio.cycle.materials.lines', [lineId], data as Record<string, unknown>)
  },

  async deleteMaterialLine(lineId: number): Promise<boolean> {
    return odooClient.unlink('afr.supervisorio.cycle.materials.lines', [lineId])
  },

  async getFotos(cycleId: number): Promise<CicloFoto[]> {
    return odooClient.searchRead<CicloFoto>(
      'afr.ciclo.fotos',
      [['ciclo_id', '=', cycleId]],
      fieldsFor('afr.ciclo.fotos', ['id', 'titulo', 'legenda', 'nome_arquivo', 'data_criacao', 'sequence']),
      { limit: 200, order: 'sequence asc, id asc' }
    )
  },

  async createFoto(cycleId: number, data: CicloFotoCreateData): Promise<number> {
    return odooClient.create('afr.ciclo.fotos', {
      ciclo_id: cycleId,
      ...data,
    })
  },

  async deleteFoto(id: number): Promise<boolean> {
    return odooClient.unlink('afr.ciclo.fotos', [id])
  },

  async updateFoto(id: number, data: { titulo?: string; legenda?: string }): Promise<boolean> {
    return odooClient.write('afr.ciclo.fotos', [id], data as Record<string, unknown>)
  },

  async forceConclude(cycleId: number): Promise<boolean> {
    const now = new Date()
    const p = (n: number) => String(n).padStart(2, '0')
    const nowUtc = `${now.getUTCFullYear()}-${p(now.getUTCMonth() + 1)}-${p(now.getUTCDate())} ${p(now.getUTCHours())}:${p(now.getUTCMinutes())}:${p(now.getUTCSeconds())}`
    return odooClient.write('afr.supervisorio.ciclos', [cycleId], {
      state: 'concluido',
      end_date: nowUtc,
    })
  },
}

export default ciclosApi
