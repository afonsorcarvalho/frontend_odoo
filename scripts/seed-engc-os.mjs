#!/usr/bin/env node
/**
 * Cria 6 Ordens de Serviço (engc.os) variadas no servidor de teste,
 * cobrindo diferentes estados, tipos de manutenção e prioridades.
 *
 * Uso:
 *   node scripts/seed-engc-os.mjs
 *
 * Variáveis de ambiente opcionais:
 *   ODOO_HOST, ODOO_PORT, ODOO_PROTO, ODOO_DB, ODOO_LOGIN, ODOO_PASSWORD
 */

import http from 'node:http'
import https from 'node:https'

const SERVER_HOST = process.env.ODOO_HOST || 'vps46593.publiccloud.com.br'
const SERVER_PORT = Number(process.env.ODOO_PORT || 8069)
const SERVER_PROTO = process.env.ODOO_PROTO || 'http'
const DB           = process.env.ODOO_DB || 'odoo-steriliza-teste'
const LOGIN        = process.env.ODOO_LOGIN || 'afonso@jgma.com.br'
const PASSWORD     = process.env.ODOO_PASSWORD || '1234'
const TIMEOUT_MS   = Number(process.env.ODOO_TIMEOUT || 30000)

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
  const data = JSON.parse(body)
  if (data.error) {
    const msg = data.error.data?.message || data.error.message
    throw new Error(`RPC error: ${msg}`)
  }
  return data.result
}

async function callKw(model, method, args, kwargs = {}) {
  return rpc('/web/dataset/call_kw', {
    model, method, args,
    kwargs: { context: { lang: 'pt_BR' }, ...kwargs },
  })
}

function toOdooDateTime(d) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
         `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}

;(async () => {
  console.log(`🔐 Autenticando em ${SERVER_PROTO}://${SERVER_HOST}:${SERVER_PORT}/${DB}...`)
  const auth = await rpc('/web/session/authenticate', { db: DB, login: LOGIN, password: PASSWORD })
  if (!auth?.uid) {
    console.error('Falha na autenticação')
    process.exit(1)
  }
  console.log(`✅ uid=${auth.uid} (${auth.name})`)

  // 1) Busca 2 equipamentos para distribuir as OSs
  const equipments = await callKw('engc.equipment', 'search_read', [[]], {
    fields: ['id', 'name', 'apelido'],
    limit: 3,
    order: 'id asc',
  })
  if (!equipments.length) {
    console.error('Nenhum equipamento encontrado em engc.equipment. Cadastre pelo menos 1 antes.')
    process.exit(1)
  }
  console.log(`📦 ${equipments.length} equipamentos disponíveis: ${equipments.map((e) => `#${e.id} ${e.name}`).join(', ')}`)

  const equipId = equipments[0].id
  const equipId2 = equipments[1]?.id ?? equipId

  // 2) Busca a company atual (obrigatória)
  const sessionInfo = await rpc('/web/session/get_session_info', {})
  const companyId = sessionInfo?.user_companies?.current_company?.[0]
    ?? sessionInfo?.company_id
    ?? 1
  console.log(`🏢 company_id=${companyId}`)

  const now = new Date()
  const dayMs = 24 * 60 * 60 * 1000

  // 3) 6 cenários
  const seeds = [
    {
      label: 'Draft recente',
      state: 'draft',
      equipment_id: equipId,
      maintenance_type: 'corrective',
      priority: '2', // Alta
      who_executor: 'own',
      solicitante: 'Maria Silva',
      date_request: toOdooDateTime(new Date(now - 2 * dayMs)),
      date_scheduled: toOdooDateTime(new Date(now.getTime() + 3 * dayMs)),
      problem_description: 'Equipamento apresentando ruído excessivo durante o ciclo de esterilização.',
    },
    {
      label: 'Em execução atrasada',
      state: 'under_repair',
      equipment_id: equipId2,
      maintenance_type: 'preventive',
      priority: '3', // Muito Alta
      who_executor: '3rd_party',
      solicitante: 'João Pereira',
      date_request: toOdooDateTime(new Date(now - 15 * dayMs)),
      date_scheduled: toOdooDateTime(new Date(now - 5 * dayMs)), // passada
      date_execution: toOdooDateTime(new Date(now - 4 * dayMs)),
      date_start: toOdooDateTime(new Date(now - 4 * dayMs)),
      maintenance_duration: 8,
      problem_description: 'Manutenção preventiva programada trimestral.',
      service_description: 'Troca de filtros, limpeza geral, verificação de vedação.',
    },
    {
      label: 'Esperando peças',
      state: 'wait_parts',
      equipment_id: equipId,
      maintenance_type: 'corrective',
      priority: '1', // Baixa
      who_executor: 'own',
      solicitante: 'Carlos Souza',
      date_request: toOdooDateTime(new Date(now - 7 * dayMs)),
      date_scheduled: toOdooDateTime(new Date(now.getTime() + 10 * dayMs)),
      problem_description: 'Porta da câmara com travamento intermitente; aguardando kit de reposição.',
    },
    {
      label: 'Pronta para execução (instalação)',
      state: 'execution_ready',
      equipment_id: equipId2,
      maintenance_type: 'instalacao',
      priority: '0', // Normal
      who_executor: '3rd_party',
      solicitante: 'Fernanda Lima',
      date_request: toOdooDateTime(new Date(now - 3 * dayMs)),
      date_scheduled: toOdooDateTime(new Date(now.getTime() + 2 * dayMs)),
      is_warranty: true,
      warranty_type: 'fabrica',
      problem_description: 'Instalação e comissionamento de equipamento novo.',
    },
    {
      label: 'Concluída',
      state: 'done',
      equipment_id: equipId,
      maintenance_type: 'calibration',
      priority: '0',
      who_executor: 'own',
      solicitante: 'Roberto Gomes',
      date_request: toOdooDateTime(new Date(now - 30 * dayMs)),
      date_scheduled: toOdooDateTime(new Date(now - 25 * dayMs)),
      date_execution: toOdooDateTime(new Date(now - 25 * dayMs)),
      date_start: toOdooDateTime(new Date(now - 25 * dayMs)),
      date_finish: toOdooDateTime(new Date(now - 24 * dayMs)),
      maintenance_duration: 6,
      problem_description: 'Calibração anual obrigatória.',
      service_description: 'Executado conforme procedimento P-CAL-003.',
    },
    {
      label: 'Cancelada',
      state: 'cancel',
      equipment_id: equipId,
      maintenance_type: 'treinamento',
      priority: '1',
      who_executor: '3rd_party',
      solicitante: 'Equipe SAC',
      date_request: toOdooDateTime(new Date(now - 10 * dayMs)),
      date_scheduled: toOdooDateTime(new Date(now - 1 * dayMs)),
      problem_description: 'Treinamento cancelado pelo cliente.',
    },
  ]

  const createdIds = []
  for (const s of seeds) {
    const { label, state, ...values } = s
    values.company_id = companyId
    try {
      const id = await callKw('engc.os', 'create', [values])
      console.log(`  ✓ #${id} ${label} [criada como draft]`)
      // Ajusta state para o desejado via write (ignora workflow)
      if (state && state !== 'draft') {
        try {
          await callKw('engc.os', 'write', [[id], { state }])
          console.log(`    → state forçado para "${state}"`)
        } catch (e) {
          console.log(`    ⚠ não foi possível setar state=${state}: ${e.message}`)
        }
      }
      createdIds.push(id)
    } catch (e) {
      console.error(`  ✗ Falha em "${label}": ${e.message}`)
    }
  }

  console.log(`\n✅ Concluído. IDs criados: ${createdIds.join(', ')}`)
  console.log(`   Total de OSs no banco agora:`)
  const total = await callKw('engc.os', 'search_count', [[]])
  console.log(`   ${total}`)
})().catch((err) => { console.error('Erro fatal:', err); process.exit(1) })
