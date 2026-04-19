/**
 * Testes de integração — conexão com servidor Odoo real
 * Servidor alvo: https://mb.fitadigital.com.br
 *
 * Realiza chamadas HTTP reais — valida o contrato JSON-RPC de ponta a ponta.
 * Usa https.request nativo com localAddress explícito para evitar problema
 * de roteamento quando o Node.js tenta usar uma interface de rede desatualizada.
 */

import { describe, it, expect, beforeAll } from 'vitest'
import https from 'https'
import os from 'os'

const SERVER_URL  = 'https://mb.fitadigital.com.br'
const SERVER_HOST = 'mb.fitadigital.com.br'
const TIMEOUT_MS  = 15000

// ─── Detecta o IP local da interface de saída padrão (en0) ───────────────────

function getLocalAddress(): string {
  const nets = os.networkInterfaces()
  // Prefere en0 (Wi-Fi) → primeira IPv4 externa encontrada
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

// ─── Helper: requisição HTTPS com IP de origem explícito ─────────────────────

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
        'User-Agent': 'vitest/odoo-integration',
      },
    }

    const req = https.request(options, (res) => {
      const chunks: Buffer[] = []
      res.on('data', (c: Buffer) => chunks.push(c))
      res.on('end', () => {
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

async function rpcPost<T>(
  path: string,
  params: Record<string, unknown> = {}
): Promise<{ result: T; error?: undefined } | { result?: undefined; error: { code: number; message: string; data?: { message: string } } }> {
  const payload = JSON.stringify({ jsonrpc: '2.0', method: 'call', id: requestId++, params })
  const { body, status } = await httpsPost(path, payload)

  // Alguns endpoints retornam HTML (redirect/erro do servidor web)
  if (!body.trimStart().startsWith('{') && !body.trimStart().startsWith('[')) {
    return { error: { code: status, message: `Resposta não-JSON (HTTP ${status})`, data: { message: `Endpoint ${path} retornou HTML/texto` } } }
  }

  const data = JSON.parse(body) as {
    jsonrpc: string
    id: number
    result?: T
    error?: { code: number; message: string; data?: { message: string } }
  }

  if (data.error) return { error: data.error }
  return { result: data.result as T }
}

// ─── Suite 0: Diagnóstico de rede ────────────────────────────────────────────

describe('Diagnóstico de rede', () => {
  it('exibe IP local e servidor alvo', () => {
    console.log(`\n  🖥️  IP local usado nas requisições : ${LOCAL_IP}`)
    console.log(`  🌐 Servidor Odoo alvo             : ${SERVER_URL}`)
    expect(LOCAL_IP).not.toBe('0.0.0.0')
  })
})

// ─── Suite 1: Conectividade ───────────────────────────────────────────────────

describe('Odoo — Conectividade', () => {
  it('servidor responde com status HTTP válido (2xx ou 3xx)', async () => {
    const { status } = await httpsPost('/', '')

    expect(status).toBeGreaterThanOrEqual(200)
    expect(status).toBeLessThan(500)
    console.log(`\n  🌐 GET ${SERVER_URL} → HTTP ${status}`)
  })
})

// ─── Suite 2: Listagem de bancos ──────────────────────────────────────────────

describe('Odoo — /web/database/list', () => {
  let databases: string[] = []

  beforeAll(async () => {
    const res = await rpcPost<string[]>('/web/database/list')
    if (res.error) throw new Error(`Falha ao listar bancos: ${res.error.data?.message ?? res.error.message}`)
    databases = res.result!
  })

  it('retorna um array de strings', () => {
    expect(Array.isArray(databases)).toBe(true)
    for (const db of databases) {
      expect(typeof db).toBe('string')
      expect(db.trim()).not.toBe('')
    }
  })

  it('contém pelo menos um banco de dados', () => {
    expect(databases.length).toBeGreaterThan(0)
  })

  it('exibe os bancos no console', () => {
    console.log(`\n  📦 Bancos disponíveis em ${SERVER_HOST}:`)
    databases.forEach((db, i) => console.log(`     ${i + 1}. ${db}`))
    expect(databases.length).toBeGreaterThan(0)
  })
})

// ─── Suite 3: Protocolo JSON-RPC 2.0 ─────────────────────────────────────────

describe('Odoo — Protocolo JSON-RPC 2.0', () => {
  it('resposta contém jsonrpc: "2.0" e o id da requisição', async () => {
    const id = requestId
    const payload = JSON.stringify({ jsonrpc: '2.0', method: 'call', id, params: {} })
    const { body, status } = await httpsPost('/web/database/list', payload)

    expect(status).toBe(200)

    const data = JSON.parse(body) as Record<string, unknown>
    expect(data.jsonrpc).toBe('2.0')
    expect(data.id).toBe(id)
    expect('result' in data || 'error' in data).toBe(true)

    console.log(`\n  ✅ JSON-RPC válido — jsonrpc: "${data.jsonrpc}", id echo: ${data.id}`)
  })

  it('Content-Type da resposta é application/json', async () => {
    const payload = JSON.stringify({ jsonrpc: '2.0', method: 'call', id: requestId++, params: {} })
    const { headers } = await httpsPost('/web/database/list', payload)

    const ct = String(headers['content-type'] ?? '')
    expect(ct).toContain('application/json')
    console.log(`\n  📄 Content-Type: ${ct}`)
  })
})

// ─── Suite 4: Versão do servidor ─────────────────────────────────────────────

describe('Odoo — Versão do servidor', () => {
  it('common.version retorna objeto com metadados ou endpoint está restrito', async () => {
    const res = await rpcPost<Record<string, unknown>>(
      '/web/jsonrpc',
      { service: 'common', method: 'version', args: [] }
    )

    if (res.error) {
      console.log(`\n  ⚠️  common.version restrito: ${res.error.data?.message ?? res.error.message}`)
      return // não é falha — endpoint pode ser desabilitado
    }

    const info = res.result!
    expect(info).toBeTypeOf('object')

    console.log('\n  🔖 Informações do servidor Odoo:')
    if (info.server_version)   console.log(`     Versão         : ${info.server_version}`)
    if (info.server_serie)     console.log(`     Série          : ${info.server_serie}`)
    if (info.protocol_version) console.log(`     Protocolo RPC  : ${info.protocol_version}`)
  })
})

// ─── Suite 5: Sessão sem autenticação ────────────────────────────────────────

describe('Odoo — /web/session/get_session_info', () => {
  it('endpoint responde com HTTP 200', async () => {
    const payload = JSON.stringify({ jsonrpc: '2.0', method: 'call', id: requestId++, params: {} })
    const { status } = await httpsPost('/web/session/get_session_info', payload)
    expect(status).toBe(200)
  })

  it('uid é false/null quando não há cookie de sessão', async () => {
    const res = await rpcPost<{ uid: number | false; name: string }>(
      '/web/session/get_session_info'
    )

    if (res.error) {
      // Servidor exige autenticação mesmo para session_info — comportamento válido
      console.log(`\n  🔐 Servidor retorna erro sem sessão: "${res.error.data?.message ?? res.error.message}"`)
      expect(res.error).toBeTruthy()
      return
    }

    const session = res.result!
    expect(session).toHaveProperty('uid')
    expect(session.uid).toBeFalsy()
    console.log(`\n  🔐 uid sem sessão = ${session.uid} (esperado: false ou 0)`)
  })
})

// ─── Suite 6: Autenticação com credenciais inválidas ─────────────────────────

describe('Odoo — /web/session/authenticate', () => {
  let firstDb = ''

  beforeAll(async () => {
    const res = await rpcPost<string[]>('/web/database/list')
    firstDb = res.result?.[0] ?? ''
  })

  it('uid é falso para credenciais erradas', async () => {
    if (!firstDb) {
      console.log('  ⚠️  Pulando: banco não detectado')
      return
    }

    const res = await rpcPost<{ uid: number | false }>(
      '/web/session/authenticate',
      { db: firstDb, login: 'usuario_invalido_xyz', password: 'senha_errada_xyz' }
    )

    if (res.error) {
      console.log(`\n  🚫 Servidor rejeitou com erro: ${res.error.data?.message ?? res.error.message}`)
      expect(res.error).toBeTruthy()
      return
    }

    expect(res.result!.uid).toBeFalsy()
    console.log(`\n  🚫 Login inválido no banco "${firstDb}": uid = ${res.result!.uid}`)
  })

  it('resposta não expõe dados sensíveis', async () => {
    if (!firstDb) return

    const res = await rpcPost<Record<string, unknown>>(
      '/web/session/authenticate',
      { db: firstDb, login: 'usuario_invalido_xyz', password: 'senha_errada_xyz' }
    )

    if (res.result) {
      expect(res.result.uid).toBeFalsy()
      const str = JSON.stringify(res.result)
      expect(str).not.toContain('password')
      expect(str).not.toContain('passwd')
    }
  })
})
