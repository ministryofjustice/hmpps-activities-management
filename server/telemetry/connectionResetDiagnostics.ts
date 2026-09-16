import { subscribe, unsubscribe } from 'node:diagnostics_channel'
import { errorMonitor } from 'node:events'
import type { ClientRequest } from 'node:http'
import { trace } from '@ministryofjustice/hmpps-azure-telemetry'
import logger from '../../logger'
import { sanitiseDownstreamEndpoint } from '../middleware/serverRequestTiming/sanitisation'

// Observes individual attempts, including failures subsequently recovered by a retry without swallowing.
export default function installConnectionResetDiagnostics(): () => void {
  const onRequest = (message: unknown) => {
    const { request } = message as { request: ClientRequest }
    const startedAt = performance.now()
    const spanContext = trace.getActiveSpan()?.spanContext()
    let responseStarted = false
    let recorded = false

    const onError = (error: NodeJS.ErrnoException) => {
      if (error.code !== 'ECONNRESET' || recorded) return
      recorded = true
      const { socket } = request
      logger.warn(
        {
          event: 'outbound_http_connection_reset',
          errorCode: error.code,
          syscall: error.syscall,
          method: request.method,
          host: request.host,
          endpoint: sanitiseDownstreamEndpoint(request.path),
          durationMs: Math.round(performance.now() - startedAt),
          reusedSocket: request.reusedSocket,
          responseStarted,
          requestFinished: request.writableFinished,
          socketConnecting: socket?.connecting,
          socketDestroyed: socket?.destroyed,
          // Byte counts are for the socket's lifetime, including earlier keep-alive requests.
          socketBytesRead: socket?.bytesRead,
          socketBytesWritten: socket?.bytesWritten,
          remoteAddress: socket?.remoteAddress,
          remotePort: socket?.remotePort,
          traceId: spanContext?.traceId,
          spanId: spanContext?.spanId,
        },
        'Outbound HTTP connection reset',
      )
    }

    request.on(errorMonitor, onError)
    request.once('response', response => {
      responseStarted = true
      response.on(errorMonitor, onError)
    })
  }

  subscribe('http.client.request.start', onRequest)
  return () => unsubscribe('http.client.request.start', onRequest)
}
