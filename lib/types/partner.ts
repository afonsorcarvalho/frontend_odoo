export interface OdooPartner {
  id: number
  name: string
  display_name: string
  email: string | false
  phone: string | false
  mobile: string | false
  street: string | false
  street2: string | false
  city: string | false
  zip: string | false
  country_id: [number, string] | false
  state_id: [number, string] | false
  is_company: boolean
  company_id: [number, string] | false
  company_name: string | false
  image_1920: string | false
  image_128: string | false
  category_id: number[]
  website: string | false
  comment: string | false
  active: boolean
  type: 'contact' | 'invoice' | 'delivery' | 'other'
  lang: string | false
  tz: string | false
  vat: string | false
  ref: string | false
  child_ids: number[]
  user_id: [number, string] | false
  create_date: string
  write_date: string
}

export type OdooPartnerSummary = Pick<
  OdooPartner,
  | 'id'
  | 'name'
  | 'display_name'
  | 'email'
  | 'phone'
  | 'mobile'
  | 'is_company'
  | 'company_id'
  | 'company_name'
  | 'image_128'
  | 'city'
  | 'country_id'
  | 'category_id'
  | 'active'
  | 'type'
>

export interface PartnerFormData {
  name: string
  email?: string
  phone?: string
  mobile?: string
  street?: string
  street2?: string
  city?: string
  zip?: string
  country_id?: number
  state_id?: number
  is_company: boolean
  company_id?: number
  website?: string
  comment?: string
  category_id?: number[]
  vat?: string
  ref?: string
  lang?: string
}

export interface ContactFilters {
  search: string
  type: 'all' | 'company' | 'person'
  country_id?: number
  category_ids: number[]
  active: boolean
}

export interface PaginatedContacts {
  records: OdooPartnerSummary[]
  total: number
  offset: number
  limit: number
  hasMore: boolean
}

export interface PartnerCategory {
  id: number
  name: string
  color: number
}

export interface Country {
  id: number
  name: string
  code: string
}
