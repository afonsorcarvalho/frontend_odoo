export type CycleState =
  | 'em_andamento'
  | 'concluido'
  | 'cancelado'
  | 'erro'
  | 'abortado'
  | 'aguardando'
  | 'pausado'

export type IBResult = 'positivo' | 'negativo'

export const CYCLE_STATE_LABEL: Record<CycleState, string> = {
  em_andamento: 'Em Andamento',
  concluido:    'Concluído',
  cancelado:    'Cancelado',
  erro:         'Erro',
  abortado:     'Abortado',
  aguardando:   'Aguardando',
  pausado:      'Pausado',
}

export interface OdooCycleSummary {
  id: number
  name: string
  display_name: string
  state: CycleState | false
  start_date: string | false
  end_date: string | false
  duration: number | false
  duration_planned: number | false
  batch_number: string | false
  equipment_id: [number, string] | false
  equipment_nickname: string | false
  cycle_type_id: [number, string] | false
  cycle_features_id: [number, string] | false
  operator_id: [number, string] | false
  material_count: number | false
  ib_resultado: IBResult | false
  is_overdue: boolean
  is_signed: boolean
}

export interface OdooCycle extends OdooCycleSummary {
  concentracao_eto_camara: number | false
  concentracao_eto_porcentagem: number | false
  cycle_features_id: [number, string] | false
  cycle_type_id: [number, string] | false
  duration_planned: number | false
  equipment_category_id: [number, string] | false
  ib_data_fim: string | false
  ib_data_inicio: string | false
  ib_lote: [number, string] | false
  ib_marca: string | false
  ib_modelo: string | false
  is_eto_equipment: boolean
  massa_eto: number | false
  massa_gas_eto: number | false
  massa_gas_eto_setpoint: number | false
  notes: string | false
  signature_date: string | false
  signature_employee_id: [number, string] | false
  signature_employee_name: string | false
  signature_professional_council: string | false
  signature_professional_council_number: string | false
  company_id: [number, string] | false
  create_date: string
  create_uid: [number, string] | false
  cycle_pdf_filename: string | false
  cycle_graph_filename: string | false
  cycle_txt_filename: string | false
  file_path: string | false
  cycle_graph: string | false
  cycle_statistics_data?: unknown | false
}

export interface CyclePhase {
  name: string
  label: string
  plannedMin: number
  actualMin?: number
}

export interface CyclePhaseInfo {
  phases: CyclePhase[]
  totalPlannedMin: number
  currentPhaseIndex: number | null
  elapsedMs: number
  finished: boolean
}

export interface CycleFilters {
  search: string
  state?: CycleState
  equipment_id?: number
  cycle_type_id?: number
  only_overdue: boolean
  only_signed: boolean
  date_from?: string
  date_to?: string
}

export type CycleMaterialUnit = 'caixa' | 'unidade' | 'pacote' | 'envelope' | 'kit' | 'outro'

export const CYCLE_MATERIAL_UNIT_LABEL: Record<CycleMaterialUnit, string> = {
  caixa: 'Caixa',
  unidade: 'Unidade',
  pacote: 'Pacote',
  envelope: 'Envelope',
  kit: 'Kit',
  outro: 'Outro',
}

export interface OdooCycleMaterial {
  id: number
  material_id: [number, string] | false
  material_descricao: string | false
  fabricante_id: [number, string] | false
  fabricante_nome: string | false
  lote: string | false
  quantidade: number | false
  unidade: CycleMaterialUnit | false
  validade: string | false
}

export interface IBLote {
  id: number
  name: string
  marca: string | false
  modelo: string | false
  data_validade: string | false
  vencido: boolean
}

export interface IBLoteCreateData {
  name: string
  marca: string
  modelo?: string
  data_validade?: string
}

export interface MaterialCatalog {
  id: number
  descricao: string
  fabricante_id: [number, string] | false
  fabricante_nome: string | false
}

export interface IBFormData {
  ib_lote: number | false
  ib_resultado: 'positivo' | 'negativo' | false
  ib_data_inicio: string | false
  ib_data_fim: string | false
}

export interface CicloFoto {
  id: number
  titulo: string
  legenda: string | false
  nome_arquivo: string | false
  data_criacao: string
  sequence: number
}

export interface CicloFotoCreateData {
  titulo: string
  imagem: string
  nome_arquivo?: string
  legenda?: string
}

export interface MaterialLineFormData {
  material_id: number
  quantidade: number
  unidade: CycleMaterialUnit
  lote: string | false
  fabricante_id: number | false
  validade: string | false
}

export interface Equipment {
  id: number
  name: string
  display_name?: string
}

export interface CycleType {
  id: number
  name: string
  display_name?: string
}

export interface CycleFeatures {
  id: number
  name: string
  display_name?: string
  cycle_type_id?: [number, string] | false
  phases_planned?: string | false
}
