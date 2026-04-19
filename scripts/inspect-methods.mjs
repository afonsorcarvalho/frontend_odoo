#!/usr/bin/env node
/**
 * Lista métodos "action_*" de um model Odoo (e outros métodos públicos
 * que parecem workflow) para ajudar a descobrir transições de estado.
 *
 * Uso:
 *   node scripts/inspect-methods.mjs engc.os
 *
 * Depende das mesmas variáveis de ambiente de inspect-model.mjs
 * (ODOO_HOST, ODOO_PORT, ODOO_PROTO, ODOO_DB, ODOO_LOGIN, ODOO_PASSWORD).
 */

import http from 'node:http'
import https from 'node:https'

const SERVER_HOST = process.env.ODOO_HOST || 'vps46593.publiccloud.com.br'
const SERVER_PORT = Number(process.env.ODOO_PORT || 8069)
const SERVER_PROTO = process.env.ODOO_PROTO || 'http'
const DB           = process.env.ODOO_DB || 'odoo-steriliza-teste'
const LOGIN        = process.env.ODOO_LOGIN || 'afonso@jgma.com.br'
const PASSWORD     = process.env.ODOO_PASSWORD || '1234'
const TIMEOUT_MS   = Number(process.env.ODOO_TIMEOUT || 20000)

const MODEL = process.argv[2]
if (!MODEL) {
  console.error('Uso: node scripts/inspect-methods.mjs <model.name>')
  process.exit(1)
}

let cookieJar = ''
let reqId = 1

function post(urlPath, body) {
  return new Promise((resolve, reject) => {
    const buf = Buffer.from(body, 'utf-8')
    const transport = SERVER_PROTO === 'http' ? http : https
    const req = transport.request(
      {
        hostname: SERVER_HOST,
        port: SERVER_PORT,
        path: urlPath,
        method: 'POST',
        timeout: TIMEOUT_MS,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': buf.length,
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
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')) })
    req.write(buf)
    req.end()
  })
}

async function rpc(path, params) {
  const payload = JSON.stringify({ jsonrpc: '2.0', method: 'call', id: reqId++, params })
  const { body } = await post(path, payload)
  return JSON.parse(body)
}

async function callKw(model, method, args, kwargs = {}) {
  return rpc('/web/dataset/call_kw', {
    model, method, args,
    kwargs: { context: { lang: 'pt_BR' }, ...kwargs },
  })
}

;(async () => {
  const auth = await rpc('/web/session/authenticate', { db: DB, login: LOGIN, password: PASSWORD })
  if (auth.error || !auth.result?.uid) {
    console.error('auth falhou:', auth.error?.data?.message || auth.error)
    process.exit(1)
  }
  console.log(`autenticado uid=${auth.result.uid} (${auth.result.name})`)

  // Pesquisa o id do ir.model
  const found = await callKw('ir.model', 'search_read', [[['model', '=', MODEL]]], {
    fields: ['id', 'name', 'model'],
    limit: 1,
  })
  if (!found.result?.length) {
    console.error(`modelo ${MODEL} não encontrado`)
    process.exit(1)
  }
  const modelId = found.result[0].id
  console.log(`model ${MODEL} (ir.model id=${modelId})`)

  // ir.model.access permissions for this user on this model
  const access = await callKw('ir.model.access', 'search_read', [[['model_id', '=', modelId]]], {
    fields: ['name', 'perm_read', 'perm_write', 'perm_create', 'perm_unlink', 'group_id'],
  })
  console.log(`\nPermissões (${access.result?.length ?? 0} ACLs):`)
  for (const a of access.result ?? []) {
    console.log(`  ${a.name}: R=${a.perm_read?'✓':' '} W=${a.perm_write?'✓':' '} C=${a.perm_create?'✓':' '} D=${a.perm_unlink?'✓':' '} group=${a.group_id?.[1] ?? '-'}`)
  }

  // Tenta buscar métodos via ir.model.data / server actions não é 100%,
  // então o jeito prático: pegar base_automation e ir.actions.server que referenciam o model.
  const srvActions = await callKw('ir.actions.server', 'search_read', [[['model_id', '=', modelId]]], {
    fields: ['name', 'state', 'code', 'type'],
    limit: 50,
  })
  console.log(`\nServer actions do modelo (${srvActions.result?.length ?? 0}):`)
  for (const a of srvActions.result ?? []) {
    console.log(`  • ${a.name} [${a.type}/${a.state}]`)
  }

  // Workflow buttons: os botões de form view estão em ir.ui.view (fields_view_get)
  const viewRes = await callKw(MODEL, 'fields_view_get', [], { view_type: 'form' })
  if (viewRes.error) {
    console.error('fields_view_get form falhou:', viewRes.error.data?.message)
  } else {
    const arch = viewRes.result.arch || ''
    const buttonRe = /<button\b[^>]*>/g
    const buttons = arch.match(buttonRe) || []
    console.log(`\nBotões na form view (${buttons.length}):`)
    const seen = new Set()
    for (const b of buttons) {
      const nameMatch = /name="([^"]+)"/.exec(b)
      const stringMatch = /string="([^"]+)"/.exec(b)
      const typeMatch = /type="([^"]+)"/.exec(b)
      const statesMatch = /states="([^"]+)"/.exec(b)
      const key = `${nameMatch?.[1]}|${typeMatch?.[1]}`
      if (seen.has(key)) continue
      seen.add(key)
      console.log(`  • ${nameMatch?.[1] ?? '??'}  (type=${typeMatch?.[1] ?? '?'}) "${stringMatch?.[1] ?? ''}" states=[${statesMatch?.[1] ?? ''}]`)
    }
  }
})().catch((e) => { console.error('erro:', e); process.exit(1) })
