/**
 * Testes de integração do sistema de schema (fields_get + check_access_rights).
 *
 * Valida que:
 *  1. fields_get retorna campos consistentes para os models da aplicação
 *  2. check_access_rights retorna booleano para cada operação CRUD
 *  3. filterFields do store remove campos inexistentes preservando válidos
 */

import { describe, it, expect, beforeAll } from 'vitest'
import https from 'https'
import os from 'os'
import { useSchemaStore } from '@/lib/store/schemaStore'
import type { FieldMeta, AccessRights } from '@/lib/store/schemaStore'

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
          ...(cookieJar ? { Cookie: cookieJar } : {}),
        },
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (c: Buffer) => chunks.push(c))
        res.on('end', () => {
          const sc = res.headers['set-cookie']
          if (sc) for (const c of sc) {
            const kv = c.split(';')[0]
            if (kv.startsWith('session_id=')) cookieJar = kv
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

async function rpc<T>(path: string, params: Record<string, unknown>) {
  const payload = JSON.stringify({ jsonrpc: '2.0', method: 'call', id: reqId++, params })
  const { body } = await httpsPost(path, payload)
  return JSON.parse(body) as { result?: T; error?: { data?: { message?: string }; message: string } }
}
async function callKw<T>(model: string, method: string, args: unknown[], kwargs: Record<string, unknown> = {}) {
  return rpc<T>('/web/dataset/call_kw', {
    model, method, args, kwargs: { context: { lang: 'pt_BR' }, ...kwargs },
  })
}

describe('Schema — fields_get + check_access_rights', () => {
  beforeAll(async () => {
    const auth = await rpc<{ uid: number }>('/web/session/authenticate', {
      db: DB, login: LOGIN, password: PASSWORD,
    })
    if (auth.error || !auth.result?.uid) {
      throw new Error(`Auth: ${auth.error?.data?.message ?? JSON.stringify(auth.error)}`)
    }
  })

  it('fields_get retorna campos para res.partner e afr.supervisorio.ciclos', async () => {
    const models = ['res.partner', 'afr.supervisorio.ciclos']
    for (const model of models) {
      const r = await callKw<Record<string, FieldMeta>>(model, 'fields_get', [], {
        attributes: ['string', 'type', 'required', 'readonly', 'selection', 'relation'],
      })
      expect(r.error).toBeUndefined()
      const fields = r.result!
      expect(typeof fields).toBe('object')
      expect(Object.keys(fields).length).toBeGreaterThan(5)
      expect(fields.id).toBeDefined()
      expect(fields.id.type).toBe('integer')
      console.log(`  ${model}: ${Object.keys(fields).length} campos`)
    }
  })

  it('check_access_rights retorna booleano para as 4 operações', async () => {
    const ops = ['read', 'write', 'create', 'unlink'] as const
    const model = 'res.partner'
    const result: Partial<AccessRights> = {}
    for (const op of ops) {
      const r = await callKw<boolean>(model, 'check_access_rights', [op], { raise_exception: false })
      expect(r.error).toBeUndefined()
      expect(typeof r.result).toBe('boolean')
      result[op] = r.result
    }
    console.log(`  ${model}: ${JSON.stringify(result)}`)
    expect(result.read).toBe(true) // user de teste deve pelo menos ler
  })

  it('filterFields remove campos fora do cache, preserva válidos', () => {
    const store = useSchemaStore.getState()
    store.clear()
    store.setModel('res.partner', {
      id:    { type: 'integer' },
      name:  { type: 'char' },
      email: { type: 'char' },
    }, { read: true, write: false, create: false, unlink: false })

    const filtered = store.filterFields('res.partner', [
      'id', 'name', 'email', 'campo_fantasma', 'partner_type', 'another_fake',
    ])
    expect(filtered).toEqual(['id', 'name', 'email'])

    // Model sem cache: devolve todos os fields (fallback seguro)
    const unknownModel = store.filterFields('model.que.nao.existe', ['a', 'b'])
    expect(unknownModel).toEqual(['a', 'b'])

    // Access helpers
    expect(store.canRead('res.partner')).toBe(true)
    expect(store.canWrite('res.partner')).toBe(false)
    expect(store.canCreate('res.partner')).toBe(false)
    expect(store.canUnlink('res.partner')).toBe(false)

    // Model sem cache: permissivo (true)
    expect(store.canWrite('model.que.nao.existe')).toBe(true)

    store.clear()
    expect(store.isLoaded('res.partner')).toBe(false)
  })

  it('clear() esvazia o store completamente', () => {
    const store = useSchemaStore.getState()
    store.setModel('x', { id: { type: 'integer' } }, { read: true, write: true, create: true, unlink: true })
    expect(store.isLoaded('x')).toBe(true)
    store.clear()
    expect(store.isLoaded('x')).toBe(false)
    expect(useSchemaStore.getState().loadedAt).toBe(0)
  })
})
