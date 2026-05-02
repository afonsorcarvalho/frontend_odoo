export type OsState =
  | 'draft'
  | 'under_budget'
  | 'pause_budget'
  | 'wait_authorization'
  | 'wait_parts'
  | 'execution_ready'
  | 'under_repair'
  | 'pause_repair'
  | 'reproved'
  | 'done'
  | 'cancel'

export const OS_STATE_LABEL: Record<OsState, string> = {
  draft:              'Criada',
  under_budget:       'Em Orçamento',
  pause_budget:       'Orçamento Pausado',
  wait_authorization: 'Esperando aprovação',
  wait_parts:         'Esperando peças',
  execution_ready:    'Pronta para Execução',
  under_repair:       'Em execução',
  pause_repair:       'Execução Pausada',
  reproved:           'Reprovada',
  done:               'Concluída',
  cancel:             'Cancelada',
}

export const OS_ACTIVE_STATES: OsState[] = [
  'draft', 'under_budget', 'pause_budget', 'wait_authorization',
  'wait_parts', 'execution_ready', 'under_repair', 'pause_repair',
]

export const OS_TERMINAL_STATES: OsState[] = ['done', 'cancel', 'reproved']

export type MaintenanceType =
  | 'corrective'
  | 'preventive'
  | 'instalacao'
  | 'treinamento'
  | 'preditiva'
  | 'qualification'
  | 'loan'
  | 'calibration'

export const MAINTENANCE_TYPE_LABEL: Record<MaintenanceType, string> = {
  corrective:    'Corretiva',
  preventive:    'Preventiva',
  instalacao:    'Instalação',
  treinamento:   'Treinamento',
  preditiva:     'Preditiva',
  qualification: 'Qualificação',
  loan:          'Comodato',
  calibration:   'Calibração',
}

export type OsPriority = '0' | '1' | '2' | '3'

export const OS_PRIORITY_LABEL: Record<OsPriority, string> = {
  '0': 'Normal',
  '1': 'Baixa',
  '2': 'Alta',
  '3': 'Muito Alta',
}

export type OsKanbanState = 'normal' | 'blocked' | 'done'
export type OsWhoExecutor = '3rd_party' | 'own'
export type OsWarrantyType = 'servico' | 'fabrica'

export interface OdooOsSummary {
  id: number
  name: string
  display_name: string
  state: OsState | false
  priority: OsPriority | false
  kanban_state: OsKanbanState | false
  maintenance_type: MaintenanceType | false
  who_executor: OsWhoExecutor | false
  equipment_id: [number, string] | false
  equipment_apelido: string | false
  equipment_tag: string | false
  equipment_model: string | false
  equipment_serial_number: string | false
  equipment_patrimonio: string | false
  equipment_category: string | false
  client_id: [number, string] | false
  solicitante: string | false
  tecnico_id: [number, string] | false
  department: [number, string] | false
  empresa_manutencao: [number, string] | false
  date_request: string | false
  date_scheduled: string | false
  date_execution: string | false
  date_start: string | false
  date_finish: string | false
  maintenance_duration: number | false
  is_warranty: boolean
  warranty_type: OsWarrantyType | false
  repaired: boolean
  write_date: string | false
}

export interface OdooOs extends OdooOsSummary {
  problem_description: string | false
  service_description: string | false
  origin: string | false
  sequence: number | false
  company_id: [number, string] | false
  create_date: string
  create_uid: [number, string] | false
  check_list_count: number | false
  check_list_created: boolean
  calibration_id: [number, string] | false
  calibration_created: boolean
  relatorios_count: number | false
  request_parts_count: number | false
  request_id: [number, string] | false
  request_service_id: [number, string] | false
  periodicity_ids: number[] | false
  tecnico_aux_id: [number, string] | false
  signature: string | false
  signature2: string | false
  technician_signature_date: string | false
  supervisor_signature_date: string | false
}

export interface OsFilters {
  search: string
  state?: OsState
  maintenance_type?: MaintenanceType
  equipment_id?: number
  date_from?: string
  date_to?: string
  only_overdue: boolean
  only_unsigned: boolean
}

export interface OsFormData {
  equipment_id: number
  maintenance_type: MaintenanceType
  priority: OsPriority
  who_executor: OsWhoExecutor
  solicitante: string
  date_request: string
  date_scheduled: string
  maintenance_duration?: number
  is_warranty?: boolean
  warranty_type?: OsWarrantyType
  client_id?: number
  tecnico_id?: number
  tecnico_aux_id?: number
  empresa_manutencao?: number
  department?: number
  problem_description?: string
  service_description?: string
  origin?: string
}

export interface Employee {
  id: number
  name: string
  display_name?: string
}

export interface HrDepartment {
  id: number
  name: string
  display_name?: string
}

export function isOsDimmed(os: Pick<OdooOsSummary, 'state'>): boolean {
  return os.state === 'cancel' || os.state === 'reproved'
}

export function isOsOverdue(cycle: Pick<OdooOsSummary, 'date_scheduled' | 'state' | 'date_finish'>): boolean {
  if (!cycle.date_scheduled) return false
  if (cycle.state && OS_TERMINAL_STATES.includes(cycle.state as OsState)) return false
  if (cycle.date_finish) return false
  const scheduled = new Date(String(cycle.date_scheduled).replace(' ', 'T') + 'Z').getTime()
  if (isNaN(scheduled)) return false
  return scheduled < Date.now()
}

// ─────────────────────────────────────────────────────────────
// Checklist
// ─────────────────────────────────────────────────────────────

export interface OsChecklistItem {
  id: number
  os_id: [number, string] | false
  section: [number, string] | false
  instruction: string | false
  check: boolean
  sequence: number
  tem_medicao: boolean
  medicao: number | false
  magnitude: string | false
  tipo_de_campo: 'float' | 'checkbox' | 'selection'
  observations: string | false
  state: 'draft' | 'done'
  relatorio_id: [number, string] | false
}

// ─────────────────────────────────────────────────────────────
// Relatórios
// ─────────────────────────────────────────────────────────────

export type OsRelatorioState = 'draft' | 'done' | 'cancel'
export type OsRelatorioType = 'orcamento' | 'manutencao' | 'instalacao' | 'treinamento' | 'calibracao' | 'qualificacao'
export type OsStateEquipment = 'parado' | 'funcionando' | 'restricao'

export const OS_RELATORIO_TYPE_LABEL: Record<OsRelatorioType, string> = {
  orcamento: 'Orçamento',
  manutencao: 'Manutenção',
  instalacao: 'Instalação',
  treinamento: 'Treinamento',
  calibracao: 'Calibração',
  qualificacao: 'Qualificação',
}

export const OS_RELATORIO_STATE_LABEL: Record<OsRelatorioState, string> = {
  draft: 'Criado',
  done: 'Concluído',
  cancel: 'Cancelado',
}

export const OS_STATE_EQUIPMENT_LABEL: Record<OsStateEquipment, string> = {
  parado: 'Parado',
  funcionando: 'Funcionando',
  restricao: 'Com Restrição',
}

export interface OsRelatorio {
  id: number
  name: string
  state: OsRelatorioState
  os_id: [number, string]
  report_type: OsRelatorioType | false
  fault_description: string | false
  service_summary: string | false
  observations: string | false
  pendency: string | false
  technicians: number[]
  state_equipment: OsStateEquipment | false
  restriction_type: string | false
  data_atendimento: string | false
  data_fim_atendimento: string | false
  time_execution: number | false
  checklist_item_ids: number[]
}

export interface OsRelatorioFormData {
  os_id: number
  report_type: OsRelatorioType
  fault_description: string
  service_summary: string
  technicians: unknown[]
  data_atendimento: string
  data_fim_atendimento: string
  state_equipment?: OsStateEquipment
  restriction_type?: string
  observations?: string
  pendency?: string
}

// ─────────────────────────────────────────────────────────────
// Peças
// ─────────────────────────────────────────────────────────────

export type OsPartState = 'requisitada' | 'autorizada' | 'aplicada' | 'nao_autorizada' | 'cancel'

export const OS_PART_STATE_LABEL: Record<OsPartState, string> = {
  requisitada: 'Requisitada',
  autorizada: 'Autorizada',
  aplicada: 'Aplicada',
  nao_autorizada: 'Não Autorizada',
  cancel: 'Cancelada',
}

export interface OsRequestPart {
  id: number
  os_id: [number, string]
  state: OsPartState
  product_id: [number, string]
  product_uom_qty: number
  product_uom: [number, string] | false
  relatorio_request_id: [number, string] | false
  relatorio_application_id: [number, string] | false
}

export interface OsRequestPartFormData {
  os_id: number
  product_id: number
  product_uom_qty: number
  relatorio_request_id?: number
  relatorio_application_id?: number
}

// ─────────────────────────────────────────────────────────────
// Produto (selector de peças)
// ─────────────────────────────────────────────────────────────

export interface OsProduct {
  id: number
  name: string
  display_name: string
  uom_id: [number, string] | false
}

export function isOsScheduledToday(cycle: Pick<OdooOsSummary, 'date_scheduled' | 'state' | 'date_finish'>): boolean {
  if (!cycle.date_scheduled) return false
  if (cycle.state && OS_TERMINAL_STATES.includes(cycle.state as OsState)) return false
  if (cycle.date_finish) return false
  const scheduled = new Date(String(cycle.date_scheduled).replace(' ', 'T') + 'Z')
  if (isNaN(scheduled.getTime())) return false
  const now = new Date()
  return (
    scheduled.getFullYear() === now.getFullYear() &&
    scheduled.getMonth() === now.getMonth() &&
    scheduled.getDate() === now.getDate()
  )
}
