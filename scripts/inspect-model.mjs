#!/usr/bin/env node
/**
 * Inspeciona um model do Odoo via JSON-RPC:
 *   1. autentica em mb-odoo
 *   2. chama <model>.fields_get()  → metadados de cada campo
 *   3. chama <model>.search_read() → 3 registros de amostra
 *   4. grava tudo em docs/<model>.json para consulta offline
 *
 * Uso:
 *   node scripts/inspect-model.mjs afr.supervisorio.ciclos
 */

import https from 'node:https'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

// ─── Config ──────────────────────────────────────────────────────────────────

const SERVER_HOST = 'mb.fitadigital.com.br'
const DB          = 'mb-odoo'
const LOGIN       = 'claude@fitadigital.com.br'
const PASSWORD    = '1234'
const TIMEOUT_MS  = 20000

const MODEL = process.argv[2]
if (!MODEL) {
  console.error('Uso: node scripts/inspect-model.mjs <model.name>')
  process.exit(1)
}

function getLocalAddress() {
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

// ─── HTTPS com cookie jar ────────────────────────────────────────────────────

let cookieJar = ''
let reqId = 1

function httpsPost(urlPath, body) {
  return new Promise((resolve, reject) => {
    const bodyBuf = Buffer.from(body, 'utf-8')
    const req = https.request(
      {
        hostname: SERVER_HOST,
        port: 443,
        path: urlPath,
        method: 'POST',
        localAddress: LOCAL_IP,
        timeout: TIMEOUT_MS,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': bodyBuf.length,
          'User-Agent': 'odoo-inspect/1.0',
          ...(cookieJar ? { Cookie: cookieJar } : {}),
        },
      },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          const setCookie = res.headers['set-cookie']
          if (setCookie) {
            for (const c of setCookie) {
              const kv = c.split(';')[0]
              if (kv.startsWith('session_id=')) cookieJar = kv
            }
          }
          resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf-8') })
        })
      }
    )
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error(`Timeout ${TIMEOUT_MS}ms`))
    })
    req.write(bodyBuf)
    req.end()
  })
}

async function rpc(urlPath, params) {
  const payload = JSON.stringify({ jsonrpc: '2.0', method: 'call', id: reqId++, params })
  const { body } = await httpsPost(urlPath, payload)
  return JSON.parse(body)
}

async function callKw(model, method, args, kwargs = {}) {
  return rpc('/web/dataset/call_kw', {
    model,
    method,
    args,
    kwargs: { context: { lang: 'pt_BR' }, ...kwargs },
  })
}

// ─── Main ────────────────────────────────────────────────────────────────────

;(async () => {
  console.log(`\n🔐 Autenticando em ${SERVER_HOST}/${DB} como ${LOGIN}...`)
  const auth = await rpc('/web/session/authenticate', { db: DB, login: LOGIN, password: PASSWORD })
  if (auth.error || !auth.result?.uid) {
    console.error('❌ Falha na autenticação:', auth.error?.data?.message ?? auth.error)
    process.exit(1)
  }
  console.log(`✅ Autenticado como ${auth.result.name} (uid=${auth.result.uid})\n`)

  // 1) fields_get
  console.log(`📋 Lendo metadados de ${MODEL}.fields_get()...`)
  const fieldsRes = await callKw(MODEL, 'fields_get', [], {
    attributes: ['string', 'type', 'required', 'readonly', 'store', 'help', 'selection', 'relation', 'relation_field'],
  })
  if (fieldsRes.error) {
    console.error(`❌ fields_get falhou: ${fieldsRes.error.data?.message ?? fieldsRes.error.message}`)
    process.exit(1)
  }
  const fields = fieldsRes.result
  const fieldNames = Object.keys(fields).sort()
  console.log(`   → ${fieldNames.length} campos encontrados`)

  // 2) search_count
  console.log(`\n🔢 Contando registros...`)
  const countRes = await callKw(MODEL, 'search_count', [[]])
  const total = countRes.error ? null : countRes.result
  console.log(`   → total = ${total}`)

  // 3) search_read (amostra com os campos "simples": não binary, não many2many relacionados grandes)
  const sampleFields = fieldNames.filter((f) => {
    const t = fields[f].type
    return t !== 'binary' && t !== 'html' && !['image', 'raw'].includes(f)
  }).slice(0, 40) // limita para resposta não ficar gigante

  console.log(`\n🔍 Lendo amostra de até 3 registros (primeiros ${sampleFields.length} campos)...`)
  const sampleRes = await callKw(MODEL, 'search_read', [[]], {
    fields: sampleFields,
    limit: 3,
    order: 'id desc',
  })
  if (sampleRes.error) {
    console.error(`⚠️  search_read falhou: ${sampleRes.error.data?.message ?? sampleRes.error.message}`)
  }
  const sample = sampleRes.result ?? []
  console.log(`   → ${sample.length} registros retornados`)

  // 4) Monta documentação
  const outDir = path.resolve(process.cwd(), 'docs')
  fs.mkdirSync(outDir, { recursive: true })
  const jsonFile = path.join(outDir, `${MODEL.replace(/\./g, '_')}.json`)
  const mdFile   = path.join(outDir, `${MODEL.replace(/\./g, '_')}.md`)

  fs.writeFileSync(
    jsonFile,
    JSON.stringify(
      {
        model: MODEL,
        server: SERVER_HOST,
        db: DB,
        generated_at: new Date().toISOString(),
        total_records: total,
        fields,
        sample,
      },
      null,
      2
    )
  )

  // Markdown resumido
  const lines = []
  lines.push(`# ${MODEL}\n`)
  lines.push(`Gerado em: ${new Date().toISOString()}`)
  lines.push(`Servidor: ${SERVER_HOST} / ${DB}`)
  lines.push(`Total de registros: ${total}\n`)
  lines.push(`## Campos (${fieldNames.length})\n`)
  lines.push('| Campo | Tipo | Label | Obrig. | RO | Relation |')
  lines.push('|-------|------|-------|--------|----|----------|')
  for (const name of fieldNames) {
    const f = fields[name]
    const label = String(f.string ?? '').replace(/\|/g, '\\|')
    lines.push(
      `| \`${name}\` | ${f.type}${f.selection ? ` (${f.selection.length} opções)` : ''} | ${label} | ${f.required ? '✓' : ''} | ${f.readonly ? '✓' : ''} | ${f.relation ?? ''} |`
    )
  }
  lines.push('\n## Amostra (até 3 registros)\n')
  lines.push('```json')
  lines.push(JSON.stringify(sample, null, 2))
  lines.push('```')
  fs.writeFileSync(mdFile, lines.join('\n'))

  console.log(`\n✅ Gerado:`)
  console.log(`   ${path.relative(process.cwd(), jsonFile)}`)
  console.log(`   ${path.relative(process.cwd(), mdFile)}`)
  console.log(`\nResumo dos campos:`)
  for (const name of fieldNames.slice(0, 30)) {
    const f = fields[name]
    const extra = f.relation ? ` → ${f.relation}` : f.selection ? ` (${f.selection.length} opções)` : ''
    console.log(`  • ${name.padEnd(32)} ${f.type.padEnd(12)} ${f.string ?? ''}${extra}`)
  }
  if (fieldNames.length > 30) console.log(`  ... +${fieldNames.length - 30} campos. Veja o .md gerado.`)
})().catch((err) => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
