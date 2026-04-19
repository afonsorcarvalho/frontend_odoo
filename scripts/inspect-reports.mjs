#!/usr/bin/env node
/**
 * Lista todos os ir.actions.report do Odoo e grava em docs/ para consulta.
 * Referência: https://www.odoo.com/documentation/16.0/developer/reference/backend/reports.html
 *
 * Uso:
 *   node scripts/inspect-reports.mjs                 # lista todos
 *   node scripts/inspect-reports.mjs <model.name>    # filtra por model
 *
 * Downloads de PDF no Odoo 16:
 *   GET  /report/pdf/<report_name>/<doc_ids>         → binário PDF
 *   POST /report/download                             → com nome customizado
 *     body: data=<encodeURIComponent(JSON.stringify([url, "qweb-pdf"]))>
 */

import https from 'node:https'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const SERVER_HOST = 'mb.fitadigital.com.br'
const DB          = 'mb-odoo'
const LOGIN       = 'claude@fitadigital.com.br'
const PASSWORD    = '1234'
const TIMEOUT_MS  = 20000

const FILTER_MODEL = process.argv[2] || null

function getLocalAddress() {
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

function httpsPost(urlPath, body) {
  return new Promise((resolve, reject) => {
    const bodyBuf = Buffer.from(body, 'utf-8')
    const req = https.request(
      {
        hostname: SERVER_HOST, port: 443, path: urlPath, method: 'POST',
        localAddress: LOCAL_IP, timeout: TIMEOUT_MS,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': bodyBuf.length,
          'User-Agent': 'odoo-inspect-reports/1.0',
          ...(cookieJar ? { Cookie: cookieJar } : {}),
        },
      },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          const setCookie = res.headers['set-cookie']
          if (setCookie) for (const c of setCookie) {
            const kv = c.split(';')[0]
            if (kv.startsWith('session_id=')) cookieJar = kv
          }
          resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString('utf-8') })
        })
      }
    )
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')) })
    req.write(bodyBuf); req.end()
  })
}

async function rpc(urlPath, params) {
  const payload = JSON.stringify({ jsonrpc: '2.0', method: 'call', id: reqId++, params })
  const { body } = await httpsPost(urlPath, payload)
  return JSON.parse(body)
}

async function callKw(model, method, args, kwargs = {}) {
  return rpc('/web/dataset/call_kw', {
    model, method, args, kwargs: { context: { lang: 'pt_BR' }, ...kwargs },
  })
}

;(async () => {
  console.log(`\n🔐 Autenticando em ${SERVER_HOST}/${DB}...`)
  const auth = await rpc('/web/session/authenticate', { db: DB, login: LOGIN, password: PASSWORD })
  if (auth.error || !auth.result?.uid) {
    console.error('❌ Auth falhou:', auth.error?.data?.message ?? auth.error)
    process.exit(1)
  }
  console.log(`✅ ${auth.result.name} (uid=${auth.result.uid})\n`)

  const domain = FILTER_MODEL ? [['model', '=', FILTER_MODEL]] : []
  const fields = [
    'id', 'name', 'report_name', 'report_type', 'model', 'binding_model_id',
    'binding_type', 'print_report_name', 'paperformat_id',
    'attachment', 'attachment_use', 'xml_id',
  ]

  console.log(`🔍 Buscando ir.actions.report${FILTER_MODEL ? ` (model=${FILTER_MODEL})` : ''}...`)
  const res = await callKw('ir.actions.report', 'search_read', [domain], {
    fields, order: 'model asc, name asc',
  })
  if (res.error) {
    console.error('❌ search_read falhou:', res.error.data?.message ?? res.error.message)
    process.exit(1)
  }
  const reports = res.result
  console.log(`   → ${reports.length} report(s) encontrado(s)\n`)

  const outDir = path.resolve(process.cwd(), 'docs')
  fs.mkdirSync(outDir, { recursive: true })
  const suffix = FILTER_MODEL ? FILTER_MODEL.replace(/\./g, '_') : 'all'
  const jsonFile = path.join(outDir, `odoo-reports-${suffix}.json`)
  const mdFile   = path.join(outDir, `odoo-reports-${suffix}.md`)

  fs.writeFileSync(jsonFile, JSON.stringify(
    { generated_at: new Date().toISOString(), filter: FILTER_MODEL, total: reports.length, reports },
    null, 2
  ))

  const md = []
  md.push(`# Odoo Reports (${FILTER_MODEL ?? 'todos'})\n`)
  md.push(`Gerado em: ${new Date().toISOString()}`)
  md.push(`Servidor: ${SERVER_HOST} / ${DB}`)
  md.push(`Total: ${reports.length}\n`)
  md.push('## URLs de download (Odoo 16)\n')
  md.push('```')
  md.push('# PDF direto (padrão)')
  md.push('GET /report/pdf/<report_name>/<doc_ids>')
  md.push('')
  md.push('# PDF com nome customizado')
  md.push('GET /report/download?data=<json>')
  md.push('    onde json = [fullUrl, "qweb-pdf"]')
  md.push('```\n')
  md.push('## Reports disponíveis\n')
  md.push('| Model | report_name | Nome | Tipo | Binding |')
  md.push('|-------|-------------|------|------|---------|')
  for (const r of reports) {
    md.push(`| \`${r.model}\` | \`${r.report_name}\` | ${r.name} | ${r.report_type} | ${r.binding_type || ''} |`)
  }
  md.push('\n## Detalhes completos\n')
  md.push('```json')
  md.push(JSON.stringify(reports, null, 2))
  md.push('```')
  fs.writeFileSync(mdFile, md.join('\n'))

  console.log(`✅ Gerado:`)
  console.log(`   ${path.relative(process.cwd(), jsonFile)}`)
  console.log(`   ${path.relative(process.cwd(), mdFile)}\n`)

  console.log('Reports encontrados:')
  console.log('━'.repeat(120))
  for (const r of reports) {
    console.log(`\n• ${r.name}`)
    console.log(`  model       : ${r.model}`)
    console.log(`  report_name : ${r.report_name}`)
    console.log(`  report_type : ${r.report_type}`)
    console.log(`  download    : /report/pdf/${r.report_name}/<id>`)
  }
})().catch((err) => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
