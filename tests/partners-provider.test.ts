/**
 * Teste de integração do provider de contatos.
 * Replica EXATAMENTE o fluxo que o frontend executa:
 *   1. autentica em /web/session/authenticate
 *   2. chama search_read + search_count em res.partner com os mesmos
 *      fields, domain e ordenação definidos em lib/odoo/partners.ts
 *
 * Objetivo: detectar campos inexistentes ou erros do servidor que
 * derrubem a listagem exibida no componente <ContactsPage />.
 *
 * Credenciais de teste fornecidas pelo usuário para mb.fitadigital.com.br.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import https from 'https'
import os from 'os'
import { PARTNER_LIST_FIELDS, PARTNER_DETAIL_FIELDS, buildDomain } from '@/lib/odoo/partners'
import type { ContactFilters } from '@/lib/types/partner'

const buildDomainForTest = buildDomain

// ─── Config ──────────────────────────────────────────────────────────────────

const SERVER_HOST = 'mb.fitadigital.com.br'
const DB          = 'mb-odoo'
const LOGIN       = 'claude@fitadigital.com.br'
const PASSWORD    = '1234'
const TIMEOUT_MS  = 15000

function getLocalAddress(): string {
  const nets = os.networkInterfaces()
  for (const name of ['en0', 'eth0', 'wlan0']) {
    const iface = nets[name]
    if (!iface) continue
    const ipv4 = iface.find((i) => i.family === 'IPv4' && !i.internal)
    if (ipv4) return ipv4.address
  }
  for (const ifaces of Object.values(nets)) {
    for (const i of ifaces ?? []) {
      if (i.family === 'IPv4' && !i.internal) return i.address
    }
  }
  return '0.0.0.0'
}

const LOCAL_IP = getLocalAddress()

// ─── Helpers HTTPS com cookie jar ────────────────────────────────────────────

let cookieJar = ''
let requestId = 1

function httpsPost(path: string, body: string): Promise<{ status: number; headers: Record<string, string | string[] | undefined>; body: string }> {
  return new Promise((resolve, reject) => {
    const bodyBuf = Buffer.from(body, 'utf-8')

    const options: https.RequestOptions = {
      hostname: SERVER_HOST,
      port: 443,
      path,
      method: 'POST',
      localAddress: LOCAL_IP,
      timeout: TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': bodyBuf.length,
        'User-Agent': 'vitest/partners-provider',
        ...(cookieJar ? { Cookie: cookieJar } : {}),
      },
    }

    const req = https.request(options, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (c: Buffer) => chunks.push(c))
      res.on('end', () => {
        const setCookie = res.headers['set-cookie']
        if (setCookie) {
          for (const c of setCookie) {
            const kv = c.split(';')[0]
            if (kv.startsWith('session_id=')) cookieJar = kv
          }
        }
        resolve({
          status: res.statusCode ?? 0,
          headers: res.headers as Record<string, string | string[] | undefined>,
          body: Buffer.concat(chunks).toString('utf-8'),
        })
      })
    })

    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error(`Timeout após ${TIMEOUT_MS}ms`))
    })

    req.write(bodyBuf)
    req.end()
  })
}

interface JsonRpcError { code: number; message: string; data?: { message?: string; name?: string } }

async function rpc<T>(path: string, params: Record<string, unknown>): Promise<{ result?: T; error?: JsonRpcError }> {
  const payload = JSON.stringify({ jsonrpc: '2.0', method: 'call', id: requestId++, params })
  const { body } = await httpsPost(path, payload)
  const data = JSON.parse(body) as { result?: T; error?: JsonRpcError }
  return data
}

async function callKw<T>(model: string, method: string, args: unknown[], kwargs: Record<string, unknown> = {}) {
  return rpc<T>('/web/dataset/call_kw', {
    model, method, args,
    kwargs: { context: { lang: 'pt_BR' }, ...kwargs },
  })
}

// ─── Setup: autentica uma única vez ──────────────────────────────────────────

describe('Provider de contatos — res.partner', () => {
  beforeAll(async () => {
    const auth = await rpc<{ uid: number; name: string }>('/web/session/authenticate', {
      db: DB, login: LOGIN, password: PASSWORD,
    })
    if (auth.error || !auth.result?.uid) {
      throw new Error(`Falha ao autenticar: ${auth.error?.data?.message ?? JSON.stringify(auth.error)}`)
    }
    if (!cookieJar) throw new Error('Cookie session_id não foi gravado após autenticação')
    console.log(`\n  ✅ Autenticado como "${auth.result.name}" (uid=${auth.result.uid})`)
  })

  // ─── Teste 1: cada campo da lista individualmente ──────────────────────────

  it('todos os PARTNER_LIST_FIELDS existem em res.partner', async () => {
    const invalidos: string[] = []
    for (const field of PARTNER_LIST_FIELDS) {
      const r = await callKw<unknown[]>('res.partner', 'search_read', [[]], {
        fields: [field], limit: 1,
      })
      if (r.error) {
        invalidos.push(`${field}: ${r.error.data?.message ?? r.error.message}`)
      }
    }
    if (invalidos.length) {
      console.log(`\n  ❌ Campos inválidos na lista:\n     - ${invalidos.join('\n     - ')}`)
    }
    expect(invalidos).toEqual([])
  })

  it('todos os PARTNER_DETAIL_FIELDS existem em res.partner', async () => {
    const invalidos: string[] = []
    for (const field of PARTNER_DETAIL_FIELDS) {
      const r = await callKw<unknown[]>('res.partner', 'search_read', [[]], {
        fields: [field], limit: 1,
      })
      if (r.error) {
        invalidos.push(`${field}: ${r.error.data?.message ?? r.error.message}`)
      }
    }
    if (invalidos.length) {
      console.log(`\n  ❌ Campos inválidos no detalhe:\n     - ${invalidos.join('\n     - ')}`)
    }
    expect(invalidos).toEqual([])
  })

  // ─── Teste 2: listPage com filtros default (o que a tela faz) ──────────────

  it('listPage com filtros default retorna contatos ativos', async () => {
    const filters: ContactFilters = {
      search: '',
      type: 'all',
      category_ids: [],
      active: true,
    }
    const domain = buildDomainForTest(filters)

    const [recordsRes, countRes] = await Promise.all([
      callKw<Array<Record<string, unknown>>>('res.partner', 'search_read', [domain], {
        fields: PARTNER_LIST_FIELDS,
        limit: 24,
        offset: 0,
        order: 'name asc',
      }),
      callKw<number>('res.partner', 'search_count', [domain]),
    ])

    if (recordsRes.error) {
      throw new Error(`search_read falhou: ${recordsRes.error.data?.message ?? recordsRes.error.message}`)
    }
    if (countRes.error) {
      throw new Error(`search_count falhou: ${countRes.error.data?.message ?? countRes.error.message}`)
    }

    const records = recordsRes.result!
    const total = countRes.result!

    expect(total).toBeGreaterThan(0)
    expect(records.length).toBeGreaterThan(0)
    expect(records.length).toBeLessThanOrEqual(total)

    console.log(`\n  📊 Total de contatos ativos: ${total}`)
    console.log(`  📄 Retornados nesta página   : ${records.length}\n`)
    console.log('  Primeiros 10:')
    records.slice(0, 10).forEach((r, i) => {
      console.log(`    ${String(i + 1).padStart(2)}. [${String(r.id).padStart(3)}] ${String(r.name).slice(0, 55)}`)
    })
  })

  // ─── Teste 3: filtros adicionais ─────────────────────────────────────────

  it('filtro type=company retorna apenas empresas', async () => {
    const domain = buildDomainForTest({
      search: '', type: 'company', category_ids: [], active: true,
    })
    const r = await callKw<Array<Record<string, unknown>>>('res.partner', 'search_read', [domain], {
      fields: ['id', 'name', 'is_company'], limit: 50, order: 'name asc',
    })
    expect(r.error).toBeUndefined()
    const records = r.result!
    expect(records.every((x) => x.is_company === true)).toBe(true)
    console.log(`\n  🏢 Empresas encontradas: ${records.length}`)
  })

  it('filtro type=person retorna apenas pessoas', async () => {
    const domain = buildDomainForTest({
      search: '', type: 'person', category_ids: [], active: true,
    })
    const r = await callKw<Array<Record<string, unknown>>>('res.partner', 'search_read', [domain], {
      fields: ['id', 'name', 'is_company'], limit: 50, order: 'name asc',
    })
    expect(r.error).toBeUndefined()
    const records = r.result!
    expect(records.every((x) => x.is_company === false)).toBe(true)
    console.log(`\n  👤 Pessoas encontradas : ${records.length}`)
  })

  // ─── Teste 4: forma dos campos retornados ────────────────────────────────

  it('campos retornados têm os tipos esperados pelo frontend', async () => {
    const r = await callKw<Array<Record<string, unknown>>>('res.partner', 'search_read', [[['active', '=', true]]], {
      fields: PARTNER_LIST_FIELDS, limit: 3, order: 'name asc',
    })
    expect(r.error).toBeUndefined()
    const records = r.result!
    expect(records.length).toBeGreaterThan(0)

    for (const rec of records) {
      expect(typeof rec.id).toBe('number')
      expect(typeof rec.name).toBe('string')
      expect(typeof rec.is_company).toBe('boolean')
      expect(typeof rec.active).toBe('boolean')
      // email/phone/mobile/city vêm como string OU false
      for (const f of ['email', 'phone', 'mobile', 'city']) {
        const v = rec[f]
        expect(v === false || typeof v === 'string').toBe(true)
      }
      // country_id: false OU [id, name]
      const country = rec.country_id
      expect(country === false || (Array.isArray(country) && country.length === 2)).toBe(true)
      // category_id: sempre array (pode ser vazio)
      expect(Array.isArray(rec.category_id)).toBe(true)
    }
  })
})
