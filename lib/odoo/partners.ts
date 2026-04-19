import odooClient from './client'
import { useSchemaStore } from '../store/schemaStore'
import { OdooError } from './client'
import type {
  OdooPartner,
  OdooPartnerSummary,
  PartnerFormData,
  ContactFilters,
  PartnerCategory,
  Country,
} from '../types/partner'

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

export const PARTNER_LIST_FIELDS: string[] = [
  'id', 'name', 'display_name', 'email', 'phone', 'mobile',
  'is_company', 'company_id', 'company_name', 'image_128',
  'city', 'country_id', 'category_id', 'active', 'type',
]

export const PARTNER_DETAIL_FIELDS: string[] = [
  'id', 'name', 'display_name', 'email', 'phone', 'mobile',
  'street', 'street2', 'city', 'zip', 'country_id', 'state_id',
  'is_company', 'company_id', 'company_name', 'image_1920',
  'category_id', 'website', 'comment', 'active', 'type',
  'lang', 'tz', 'vat', 'ref', 'child_ids', 'user_id',
  'create_date', 'write_date',
]

export function buildDomain(filters: ContactFilters): unknown[] {
  const domain: unknown[] = [['active', '=', filters.active]]

  if (filters.search.trim()) {
    domain.push(
      '|', '|', '|',
      ['name', 'ilike', filters.search.trim()],
      ['email', 'ilike', filters.search.trim()],
      ['phone', 'ilike', filters.search.trim()],
      ['city', 'ilike', filters.search.trim()]
    )
  }

  if (filters.type === 'company') {
    domain.push(['is_company', '=', true])
  } else if (filters.type === 'person') {
    domain.push(['is_company', '=', false])
  }

  if (filters.country_id) {
    domain.push(['country_id', '=', filters.country_id])
  }

  if (filters.category_ids.length > 0) {
    domain.push(['category_id', 'in', filters.category_ids])
  }

  return domain
}

function prepareWritePayload(data: Partial<PartnerFormData>): Record<string, unknown> {
  const payload: Record<string, unknown> = {}

  const simpleFields = [
    'name', 'email', 'phone', 'mobile', 'street', 'street2',
    'city', 'zip', 'is_company', 'website', 'comment', 'vat', 'ref', 'lang',
  ] as const

  for (const field of simpleFields) {
    if (data[field] !== undefined) {
      payload[field] = data[field] || false
    }
  }

  if (data.country_id !== undefined) payload['country_id'] = data.country_id || false
  if (data.state_id !== undefined) payload['state_id'] = data.state_id || false
  if (data.company_id !== undefined) payload['company_id'] = data.company_id || false
  if (data.category_id !== undefined) payload['category_id'] = [[6, 0, data.category_id || []]]

  return payload
}

export const partnersApi = {
  async listPage(
    filters: ContactFilters,
    pageParam = 0,
    pageSize = 24
  ): Promise<{ records: OdooPartnerSummary[]; nextCursor: number | null; total: number }> {
    const domain = buildDomain(filters)

    const [records, total] = await Promise.all([
      odooClient.searchRead<OdooPartnerSummary>(
        'res.partner',
        domain,
        fieldsFor('res.partner', PARTNER_LIST_FIELDS),
        { limit: pageSize, offset: pageParam, order: 'name asc' }
      ),
      odooClient.searchCount('res.partner', domain),
    ])

    const nextCursor = pageParam + records.length < total ? pageParam + pageSize : null
    return { records, nextCursor, total }
  },

  async getById(id: number): Promise<OdooPartner> {
    const records = await odooClient.read<OdooPartner>(
      'res.partner',
      [id],
      fieldsFor('res.partner', PARTNER_DETAIL_FIELDS)
    )
    if (!records?.length) throw new Error(`Contato #${id} não encontrado`)
    return records[0]
  },

  async create(data: PartnerFormData): Promise<number> {
    assertCan('res.partner', 'create')
    return odooClient.create('res.partner', prepareWritePayload(data))
  },

  async update(id: number, data: Partial<PartnerFormData>): Promise<boolean> {
    assertCan('res.partner', 'write')
    return odooClient.write('res.partner', [id], prepareWritePayload(data))
  },

  async archive(id: number): Promise<boolean> {
    assertCan('res.partner', 'write')
    return odooClient.write('res.partner', [id], { active: false })
  },

  async unarchive(id: number): Promise<boolean> {
    assertCan('res.partner', 'write')
    return odooClient.write('res.partner', [id], { active: true })
  },

  async getCategories(): Promise<PartnerCategory[]> {
    return odooClient.searchRead<PartnerCategory>(
      'res.partner.category',
      [],
      fieldsFor('res.partner.category', ['id', 'name', 'color']),
      { limit: 200, order: 'name asc' }
    )
  },

  async getCountries(): Promise<Country[]> {
    return odooClient.searchRead<Country>(
      'res.country',
      [],
      fieldsFor('res.country', ['id', 'name', 'code']),
      { limit: 300, order: 'name asc' }
    )
  },

  async uploadImage(id: number, file: File): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1]
        try {
          resolve(await odooClient.write('res.partner', [id], { image_1920: base64 }))
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  },
}

export default partnersApi
