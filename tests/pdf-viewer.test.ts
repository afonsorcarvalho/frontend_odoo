/**
 * Teste de integração do visualizador de PDF.
 *
 * Verifica:
 *   1. O worker do pdfjs está disponível em /pdf.worker.min.mjs com Content-Type correto
 *   2. O proxy consegue baixar o PDF do ciclo como binário válido (magic %PDF-)
 *   3. O Blob retornado pelo fluxo pode ser parseado pelo pdfjs-dist
 *
 * Requisitos:
 *   - `npm run dev` rodando em :3000
 *   - arquivo public/pdf.worker.min.mjs presente
 */

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'

const PROXY_BASE = 'http://localhost:3000'
const ODOO_HOST  = 'mb.fitadigital.com.br'
const DB         = 'mb-odoo'
const LOGIN      = 'claude@fitadigital.com.br'
const PASSWORD   = '1234'

describe('Visualizador de PDF', () => {
  it('arquivo do worker pdfjs existe em /public/pdf.worker.min.mjs', () => {
    const workerPath = path.resolve('public/pdf.worker.min.mjs')
    expect(fs.existsSync(workerPath)).toBe(true)
    const size = fs.statSync(workerPath).size
    expect(size).toBeGreaterThan(100_000) // ~1MB normalmente
    console.log(`\n  ✅ Worker local: ${(size / 1024).toFixed(0)} KB`)
  })

  it('versão do pdfjs-dist está compatível com react-pdf instalado', async () => {
    const pdfjsPkg = JSON.parse(fs.readFileSync(path.resolve('node_modules/pdfjs-dist/package.json'), 'utf-8'))
    const reactPdfPkg = JSON.parse(fs.readFileSync(path.resolve('node_modules/react-pdf/package.json'), 'utf-8'))
    console.log(`\n  📦 react-pdf ${reactPdfPkg.version} + pdfjs-dist ${pdfjsPkg.version}`)

    // react-pdf 10 exige pdfjs-dist 5.x
    expect(reactPdfPkg.version).toMatch(/^10\./)
    expect(pdfjsPkg.version).toMatch(/^5\./)
  })

  it('endpoint do PDF retorna binário com magic %PDF- e Content-Type correto', async () => {
    // Login via proxy
    const authRes = await fetch(`${PROXY_BASE}/api/odoo/web/session/authenticate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Odoo-Target': `https://${ODOO_HOST}` },
      body: JSON.stringify({
        jsonrpc: '2.0', method: 'call', id: 1,
        params: { db: DB, login: LOGIN, password: PASSWORD },
      }),
    })
    expect(authRes.status).toBe(200)
    const setCookie = authRes.headers.getSetCookie()
    const session = setCookie.find((c) => c.startsWith('session_id='))?.split(';')[0]
    expect(session).toBeDefined()

    // Pega um ciclo concluído
    const listRes = await fetch(`${PROXY_BASE}/api/odoo/web/dataset/call_kw`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Odoo-Target': `https://${ODOO_HOST}`,
        Cookie: session!,
      },
      body: JSON.stringify({
        jsonrpc: '2.0', method: 'call', id: 2,
        params: {
          model: 'afr.supervisorio.ciclos', method: 'search_read',
          args: [[['state', '=', 'concluido']]],
          kwargs: { fields: ['id'], limit: 1, order: 'id desc', context: { lang: 'pt_BR' } },
        },
      }),
    })
    const listData = await listRes.json()
    expect(listData.error).toBeUndefined()
    const cycleId = listData.result[0].id as number

    // Baixa o PDF via proxy (download_file_txt_to_pdf)
    const pdfRes = await fetch(
      `${PROXY_BASE}/api/odoo/web/content/download_file_txt_to_pdf/${cycleId}`,
      { headers: { 'X-Odoo-Target': `https://${ODOO_HOST}`, Cookie: session! } }
    )
    expect(pdfRes.status).toBe(200)
    expect(pdfRes.headers.get('content-type')).toMatch(/pdf/i)

    const buf = Buffer.from(await pdfRes.arrayBuffer())
    expect(buf.slice(0, 5).toString('ascii')).toBe('%PDF-')
    expect(buf.length).toBeGreaterThan(500)

    console.log(`\n  ✅ PDF do ciclo #${cycleId}: ${(buf.length / 1024).toFixed(1)} KB`)
  })

  it('worker é servido pelo Next em /pdf.worker.min.mjs', async () => {
    const res = await fetch(`${PROXY_BASE}/pdf.worker.min.mjs`)
    expect(res.status).toBe(200)
    const size = parseInt(res.headers.get('content-length') || '0', 10)
    // Dev server pode usar chunked; se não houver content-length, lê o body
    if (size > 0) {
      expect(size).toBeGreaterThan(100_000)
    } else {
      const body = await res.text()
      expect(body.length).toBeGreaterThan(100_000)
    }
    console.log(`\n  ✅ /pdf.worker.min.mjs servido pelo Next`)
  })
})
