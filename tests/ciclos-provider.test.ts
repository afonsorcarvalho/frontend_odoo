/**
 * Teste de integração do provider de ciclos (afr.supervisorio.ciclos).
 * Valida que todos os fields usados no listPage e detail existem no Odoo real.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import https from 'https'
import os from 'os'
import {
  CYCLE_LIST_FIELDS,
  CYCLE_DETAIL_FIELDS,
  buildCycleDomain,
} from '@/lib/odoo/ciclos'
import type { CycleFilters } from '@/lib/types/ciclo'

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
  return '0.0.0.0'
}
const LOCAL_IP = getLocalAddress()

let cookieJar = ''
let reqId = 1

function httpsPost(path: string, body: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const buf = Buffer.from(body, 'utf-8')
    const req = https.request(
      {
        hostname: SERVER_HOST, port: 443, path, method: 'POST',
        localAddress: LOCAL_IP, timeout: TIMEOUT_MS,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': buf.length,
          'User-Agent': 'vitest/ciclos-provider',
          ...(cookieJar ? { Cookie: cookieJar } : {}),
        },
      },
      (res) => {
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
          resolve({ status: res.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf-8') })
        })
      }
    )
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')) })
    req.write(buf); req.end()
  })
}

interface RpcErr { code: number; message: string; data?: { message?: string } }
async function rpc<T>(path: string, params: Record<string, unknown>) {
  const payload = JSON.stringify({ jsonrpc: '2.0', method: 'call', id: reqId++, params })
  const { body } = await httpsPost(path, payload)
  return JSON.parse(body) as { result?: T; error?: RpcErr }
}
async function callKw<T>(model: string, method: string, args: unknown[], kwargs: Record<string, unknown> = {}) {
  return rpc<T>('/web/dataset/call_kw', {
    model, method, args, kwargs: { context: { lang: 'pt_BR' }, ...kwargs },
  })
}

describe('Provider de ciclos — afr.supervisorio.ciclos', () => {
  beforeAll(async () => {
    const auth = await rpc<{ uid: number; name: string }>('/web/session/authenticate', {
      db: DB, login: LOGIN, password: PASSWORD,
    })
    if (auth.error || !auth.result?.uid) {
      throw new Error(`Auth falhou: ${auth.error?.data?.message ?? JSON.stringify(auth.error)}`)
    }
    console.log(`\n  ✅ Autenticado como "${auth.result.name}"`)
  })

  it('todos os CYCLE_LIST_FIELDS existem', async () => {
    const invalidos: string[] = []
    for (const f of CYCLE_LIST_FIELDS) {
      const r = await callKw<unknown[]>('afr.supervisorio.ciclos', 'search_read', [[]], { fields: [f], limit: 1 })
      if (r.error) invalidos.push(`${f}: ${r.error.data?.message ?? r.error.message}`)
    }
    if (invalidos.length) console.log(`\n  ❌ Inválidos:\n   - ${invalidos.join('\n   - ')}`)
    expect(invalidos).toEqual([])
  })

  it('todos os CYCLE_DETAIL_FIELDS existem', async () => {
    const invalidos: string[] = []
    for (const f of CYCLE_DETAIL_FIELDS) {
      const r = await callKw<unknown[]>('afr.supervisorio.ciclos', 'search_read', [[]], { fields: [f], limit: 1 })
      if (r.error) invalidos.push(`${f}: ${r.error.data?.message ?? r.error.message}`)
    }
    if (invalidos.length) console.log(`\n  ❌ Inválidos:\n   - ${invalidos.join('\n   - ')}`)
    expect(invalidos).toEqual([])
  })

  it('listPage com filtros default retorna ciclos', async () => {
    const filters: CycleFilters = {
      search: '', state: undefined, equipment_id: undefined, cycle_type_id: undefined,
      only_overdue: false, only_signed: false, date_from: undefined, date_to: undefined,
    }
    const domain = buildCycleDomain(filters)

    const [rRes, cRes] = await Promise.all([
      callKw<Array<Record<string, unknown>>>('afr.supervisorio.ciclos', 'search_read', [domain], {
        fields: CYCLE_LIST_FIELDS, limit: 24, offset: 0, order: 'start_date desc, id desc',
      }),
      callKw<number>('afr.supervisorio.ciclos', 'search_count', [domain]),
    ])

    expect(rRes.error).toBeUndefined()
    expect(cRes.error).toBeUndefined()
    const records = rRes.result!
    const total = cRes.result!

    expect(total).toBeGreaterThan(0)
    expect(records.length).toBeGreaterThan(0)

    console.log(`\n  📊 Total de ciclos: ${total} | Página: ${records.length}`)
    console.log('  Primeiros 5:')
    records.slice(0, 5).forEach((r, i) => {
      const eq = r.equipment_id as [number, string] | false
      const eqName = eq ? eq[1] : '-'
      console.log(`    ${i + 1}. [${r.id}] ${String(r.name).slice(0, 30)} · ${r.state} · ${eqName}`)
    })
  })

  it('filtro state=concluido retorna apenas concluídos', async () => {
    const domain = buildCycleDomain({
      search: '', state: 'concluido', only_overdue: false, only_signed: false,
    })
    const r = await callKw<Array<Record<string, unknown>>>('afr.supervisorio.ciclos', 'search_read', [domain], {
      fields: ['id', 'state'], limit: 20, order: 'id desc',
    })
    expect(r.error).toBeUndefined()
    const records = r.result!
    expect(records.every((x) => x.state === 'concluido')).toBe(true)
    console.log(`\n  ✅ Concluídos: ${records.length}`)
  })

  it('getById retorna detalhe completo', async () => {
    const firstList = await callKw<Array<{ id: number }>>('afr.supervisorio.ciclos', 'search_read', [[]], {
      fields: ['id'], limit: 1, order: 'id desc',
    })
    expect(firstList.error).toBeUndefined()
    const id = firstList.result![0].id

    const detail = await callKw<Array<Record<string, unknown>>>('afr.supervisorio.ciclos', 'read', [[id]], {
      fields: CYCLE_DETAIL_FIELDS,
    })
    expect(detail.error).toBeUndefined()
    expect(detail.result!.length).toBe(1)
    const rec = detail.result![0]
    expect(rec.id).toBe(id)
    expect(typeof rec.name).toBe('string')
    console.log(`\n  📄 Detalhe #${id}: "${rec.name}" · state=${rec.state}`)
  })
})
