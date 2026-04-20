// Cliente do bus do Odoo via SSE bridge em /api/os/bus.
// O Next abre WebSocket para o Odoo (com sessão) e republica como Server-Sent Events.
// Browser → SSE; servidor Next → WebSocket → Odoo.

const SSE_URL = '/api/os/bus'

export interface BusMessage<T = unknown> {
  id: number
  type: string
  payload: T
}

interface RawBusItem {
  id: number
  message: { type: string; payload: unknown } | string
}

export interface BusSubscription {
  close(): void
}

export function subscribeBus(
  onMessage: (msg: BusMessage) => void,
  onStatus?: (status: 'connecting' | 'open' | 'error' | 'closed') => void
): BusSubscription {
  let es: EventSource | null = new EventSource(SSE_URL)
  onStatus?.('connecting')

  es.addEventListener('open', () => onStatus?.('open'))
  es.addEventListener('error', () => onStatus?.('error'))
  es.addEventListener('close', () => onStatus?.('closed'))

  es.onmessage = (e) => {
    if (!e.data) return
    try {
      const parsed = JSON.parse(e.data) as RawBusItem[] | RawBusItem
      const items = Array.isArray(parsed) ? parsed : [parsed]
      for (const r of items) {
        const msg = typeof r.message === 'string'
          ? { type: 'raw', payload: r.message }
          : r.message
        onMessage({ id: r.id, type: msg.type, payload: msg.payload })
      }
    } catch {
      // Ignora payloads não-JSON (heartbeats vêm como comentário ":ping" e não disparam onmessage).
    }
  }

  return {
    close() {
      es?.close()
      es = null
    },
  }
}
