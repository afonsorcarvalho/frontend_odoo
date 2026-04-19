/**
 * Testes de integração do download de reports Odoo.
 * Usa o proxy do Next.js em http://localhost:3000 (precisa estar rodando).
 *
 * Valida:
 *   1. Os reports documentados em lib/odoo/reports.ts existem no Odoo
 *   2. O endpoint /report/pdf/... retorna um PDF real (magic bytes %PDF-)
 *   3. O proxy preserva o binário (Content-Type, arrayBuffer)
 */

import { describe, it, expect, beforeAll } from 'vitest'
import https from 'https'
import os from 'os'
import { getReportsFor } from '@/lib/odoo/reports'

const PROXY_BASE  = 'http://localhost:3000'
const ODOO_HOST   = 'mb.fitadigital.com.br'
const DB          = 'mb-odoo'
const LOGIN       = 'claude@fitadigital.com.br'
const PASSWORD    = '1234'
const TIMEOUT_MS  = 30000

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

// Autentica direto no Odoo (para os testes de "existe no Odoo")
function httpsPost(path: string, body: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const buf = Buffer.from(body, 'utf-8')
    const req = https.request(
      {
        hostname: ODOO_HOST, port: 443, path, method: 'POST',
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

describe('Reports — afr.supervisorio.ciclos', () => {
  const reports = getReportsFor('afr.supervisorio.ciclos')

  beforeAll(async () => {
    const auth = await rpc<{ uid: number; name: string }>('/web/session/authenticate', {
      db: DB, login: LOGIN, password: PASSWORD,
    })
    if (auth.error || !auth.result?.uid) {
      throw new Error(`Auth falhou: ${auth.error?.data?.message ?? JSON.stringify(auth.error)}`)
    }
  })

  it('catálogo local contém pelo menos 1 report', () => {
    expect(reports.length).toBeGreaterThan(0)
    for (const r of reports) {
      expect(r.report_name).toMatch(/^[a-z_]+\.[a-z_]+/)
      expect(r.label).toBeTruthy()
    }
  })

  it('todos os reports catalogados existem no Odoo', async () => {
    const names = reports.map((r) => r.report_name)
    const res = await rpc<Array<{ id: number; report_name: string }>>('/web/dataset/call_kw', {
      model: 'ir.actions.report',
      method: 'search_read',
      args: [[['report_name', 'in', names]]],
      kwargs: { fields: ['id', 'report_name', 'model'], context: { lang: 'pt_BR' } },
    })
    expect(res.error).toBeUndefined()
    const foundNames = (res.result ?? []).map((r) => r.report_name)
    const missing = names.filter((n) => !foundNames.includes(n))
    if (missing.length) console.log('\n  ❌ Reports não encontrados no Odoo:', missing)
    expect(missing).toEqual([])
    console.log(`\n  ✅ ${foundNames.length}/${names.length} reports existem no Odoo`)
  })

  it('download via proxy retorna PDF válido (magic bytes %PDF-)', async () => {
    // Pega um ciclo concluído para ter PDF consistente
    const listRes = await rpc<Array<{ id: number; name: string }>>('/web/dataset/call_kw', {
      model: 'afr.supervisorio.ciclos',
      method: 'search_read',
      args: [[['state', '=', 'concluido']]],
      kwargs: { fields: ['id', 'name'], limit: 1, order: 'id desc', context: { lang: 'pt_BR' } },
    })
    expect(listRes.error).toBeUndefined()
    expect(listRes.result?.length).toBeGreaterThan(0)
    const cycleId = listRes.result![0].id

    // Proxy precisa estar rodando em :3000 — faz login via proxy pra ter cookie na sessão do proxy
    const proxyAuth = await fetch(`${PROXY_BASE}/api/odoo/web/session/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Odoo-Target': `https://${ODOO_HOST}` },
      body: JSON.stringify({
        jsonrpc: '2.0', method: 'call', id: 1,
        params: { db: DB, login: LOGIN, password: PASSWORD },
      }),
    })
    expect(proxyAuth.status).toBe(200)
    const setCookie = proxyAuth.headers.getSetCookie()
    const sessionCookie = setCookie.find((c) => c.startsWith('session_id='))?.split(';')[0]
    expect(sessionCookie).toBeDefined()

    const report = reports[0]
    const pdfRes = await fetch(
      `${PROXY_BASE}/api/odoo/report/pdf/${encodeURIComponent(report.report_name)}/${cycleId}`,
      {
        method: 'GET',
        headers: {
          'X-Odoo-Target': `https://${ODOO_HOST}`,
          Cookie: sessionCookie!,
        },
      }
    )
    expect(pdfRes.status).toBe(200)
    expect(pdfRes.headers.get('content-type')).toMatch(/pdf/i)

    const buf = Buffer.from(await pdfRes.arrayBuffer())
    const magic = buf.slice(0, 5).toString('ascii')
    expect(magic).toBe('%PDF-')
    expect(buf.length).toBeGreaterThan(500)

    console.log(`\n  📄 PDF baixado: ${(buf.length / 1024).toFixed(1)} KB · ciclo #${cycleId} · "${report.label}"`)
  })
})
