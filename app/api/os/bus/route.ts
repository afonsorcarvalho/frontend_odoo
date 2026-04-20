import { NextRequest } from 'next/server'
import WebSocket from 'ws'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const DEFAULT_ODOO_URL = process.env.ODOO_URL || 'http://localhost:8069'
// O Odoo 16 atual exige WebSocket no worker gevent (porta separada).
// Configure ODOO_GEVENT_URL apontando para o gevent_port (default container 8072).
// Ex: ODOO_GEVENT_URL=ws://localhost:8073
const GEVENT_URL_ENV = process.env.ODOO_GEVENT_URL
const CHANNEL = 'engc.os'

function resolveHttpBase(req: NextRequest): string {
  const cookieTarget = req.cookies.get('odoo-target')?.value
  let raw = (cookieTarget || DEFAULT_ODOO_URL).trim().replace(/\/+$/, '')
  if (raw && !/^https?:\/\//i.test(raw)) raw = 'https://' + raw
  return raw
}

function resolveWsUrl(httpBase: string): string {
  if (GEVENT_URL_ENV) {
    const base = GEVENT_URL_ENV.trim().replace(/\/+$/, '')
    if (/^wss?:\/\//i.test(base)) return base + '/websocket'
    return base.replace(/^http/i, (m) => (m.toLowerCase() === 'https' ? 'wss' : 'ws')) + '/websocket'
  }
  // Fallback: deriva do HTTP base trocando portas conhecidas (8069→8072, 8083→8073).
  const derived = httpBase
    .replace(/:8069(\b|\/|$)/, ':8072$1')
    .replace(/:8083(\b|\/|$)/, ':8073$1')
  return derived.replace(/^http/i, (m) => (m.toLowerCase() === 'https' ? 'wss' : 'ws')) + '/websocket'
}

export async function GET(request: NextRequest) {
  const sessionId = request.cookies.get('session_id')?.value
  if (!sessionId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const httpBase = resolveHttpBase(request)
  const wsUrl = resolveWsUrl(httpBase)
  const origin = httpBase

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      let closed = false
      let ws: WebSocket | null = null
      let pingTimer: ReturnType<typeof setInterval> | null = null

      const send = (line: string) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(line))
        } catch {
          cleanup()
        }
      }

      const cleanup = () => {
        if (closed) return
        closed = true
        if (pingTimer) clearInterval(pingTimer)
        try { ws?.close() } catch { /* ignore */ }
        try { controller.close() } catch { /* ignore */ }
      }

      request.signal.addEventListener('abort', cleanup)

      try {
        ws = new WebSocket(wsUrl, {
          headers: {
            Cookie: `session_id=${sessionId}`,
            Origin: origin,
          },
        })
      } catch (err) {
        send(`event: error\ndata: ${JSON.stringify({ message: (err as Error).message })}\n\n`)
        cleanup()
        return
      }

      ws.on('open', () => {
        send(`event: open\ndata: {}\n\n`)
        ws?.send(JSON.stringify({
          event_name: 'subscribe',
          data: { channels: [CHANNEL], last: 0 },
        }))
        pingTimer = setInterval(() => send(`: ping\n\n`), 25_000)
      })

      ws.on('message', (raw) => {
        send(`data: ${raw.toString()}\n\n`)
      })

      ws.on('close', (code, reason) => {
        send(`event: close\ndata: ${JSON.stringify({ code, reason: reason?.toString() || '' })}\n\n`)
        cleanup()
      })

      ws.on('error', (err) => {
        send(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`)
        cleanup()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
