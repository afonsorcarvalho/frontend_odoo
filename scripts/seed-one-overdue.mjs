#!/usr/bin/env node
import http from 'node:http'
import https from 'node:https'

const SERVER_HOST = process.env.ODOO_HOST || 'vps46593.publiccloud.com.br'
const SERVER_PORT = Number(process.env.ODOO_PORT || 8069)
const SERVER_PROTO = process.env.ODOO_PROTO || 'http'
const DB           = process.env.ODOO_DB || 'odoo-steriliza-teste'
const LOGIN        = process.env.ODOO_LOGIN || 'afonso@jgma.com.br'
const PASSWORD     = process.env.ODOO_PASSWORD || '1234'

let cookieJar = ''
let reqId = 1

function post(urlPath, body) {
  return new Promise((resolve, reject) => {
    const buf = Buffer.from(body, 'utf-8')
    const transport = SERVER_PROTO === 'http' ? http : https
    const req = transport.request({
      hostname: SERVER_HOST, port: SERVER_PORT, path: urlPath, method: 'POST',
      timeout: 20000,
      headers: { 'Content-Type': 'application/json', 'Content-Length': buf.length, ...(cookieJar ? { Cookie: cookieJar } : {}) },
    }, (res) => {
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => {
        const sc = res.headers['set-cookie']
        if (sc) for (const c of sc) { const kv = c.split(';')[0]; if (kv.startsWith('session_id=')) cookieJar = kv }
        resolve({ body: Buffer.concat(chunks).toString() })
      })
    })
    req.on('error', reject); req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
    req.write(buf); req.end()
  })
}

async function rpc(path, params) {
  const r = JSON.parse((await post(path, JSON.stringify({ jsonrpc: '2.0', method: 'call', id: reqId++, params }))).body)
  if (r.error) throw new Error(r.error.data?.message || r.error.message)
  return r.result
}

const callKw = (model, method, args, kwargs = {}) =>
  rpc('/web/dataset/call_kw', { model, method, args, kwargs: { context: { lang: 'pt_BR' }, ...kwargs } })

const pad = (n) => String(n).padStart(2, '0')
const toDT = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`

;(async () => {
  await rpc('/web/session/authenticate', { db: DB, login: LOGIN, password: PASSWORD })
  const equipments = await callKw('engc.equipment', 'search_read', [[]], { fields: ['id'], limit: 2, order: 'id asc' })
  const now = new Date()
  const dayMs = 86400000
  const id = await callKw('engc.os', 'create', [{
    equipment_id: equipments[1]?.id ?? equipments[0].id,
    maintenance_type: 'corrective',
    priority: '3',
    who_executor: '3rd_party',
    solicitante: 'João Pereira',
    date_request: toDT(new Date(now - 15 * dayMs)),
    date_scheduled: toDT(new Date(now - 5 * dayMs)),
    date_execution: toDT(new Date(now - 4 * dayMs)),
    date_start: toDT(new Date(now - 4 * dayMs)),
    maintenance_duration: 8,
    problem_description: 'Vazamento no sistema de vácuo identificado durante rotina.',
    service_description: 'Substituição de vedações e teste de estanqueidade.',
    company_id: 1,
  }])
  await callKw('engc.os', 'write', [[id], { state: 'under_repair' }])
  console.log(`✓ criada OS #${id} em execução atrasada`)
})().catch((e) => { console.error(e); process.exit(1) })
