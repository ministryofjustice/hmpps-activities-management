import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'
import type { Request, RequestHandler, Response } from 'express'
import { RestClient } from '@ministryofjustice/hmpps-rest-client'
import { trace } from '@ministryofjustice/hmpps-azure-telemetry'
import logger from '../../../logger'
import { normaliseExpressRoute, sanitiseDownstreamEndpoint } from './sanitisation'

type TimingOutcome = 'completed' | 'failed' | 'aborted'

type TimedOperation = {
  sequence: number
  startedAt: number
  startMs: number
  durationMs?: number
  outcome?: TimingOutcome
}

type DownstreamTiming = TimedOperation & {
  parentSequence?: number
  concurrentWith: number[]
  duplicateIndex: number
  service: string
  method: string
  endpoint: string
  status?: number
  connectionReused?: boolean
  errorCode?: string
}

type RenderTiming = TimedOperation & {
  view: string
}

type ActiveSpan = ReturnType<typeof trace.getActiveSpan>

type RequestTiming = {
  startedAt: number
  now: () => number
  correlationId: string
  serverSpan?: ActiveSpan
  nextSequence: number
  downstream: DownstreamTiming[]
  renders: RenderTiming[]
  duplicateCounts: Map<string, number>
  route?: string
}

type TimingScope = {
  request: RequestTiming
  parentSequence?: number
}

type TimingLogger = {
  info: (fields: object, message: string) => void
}

export type ServerRequestTimingOptions = {
  enabled: boolean
  serverTimingHeader?: boolean
  timingLogger?: TimingLogger
  now?: () => number
}

type RestClientRequest = {
  path?: unknown
  raw?: boolean
  errorHandler?: (path: string, method: string, error: unknown) => unknown
  [key: string]: unknown
}

type RestClientMethod = (request: RestClientRequest, authOptions?: unknown) => Promise<unknown>

type RestClientInstance = {
  name?: unknown
}

type RestClientResponse = {
  status: number
  body: unknown
}

const storage = new AsyncLocalStorage<TimingScope>()
const installedMarker = Symbol.for('hmpps.activities.serverRequestTiming.installed')
const serverTimingHeaderMaxLength = 4096
const noisyPathPrefixes = [
  '/assets',
  '/favicon.ico',
  '/health',
  '/info',
  '/metrics',
  '/ping',
  '/profileImage',
  '/robots.txt',
]

const roundMilliseconds = (duration: number): number => Math.round(duration * 10) / 10

const safeLabel = (value: unknown, fallback: string): string => {
  if (typeof value !== 'string') return fallback

  const label = Array.from(value)
    .filter(character => {
      const codePoint = character.charCodeAt(0)
      return codePoint >= 32 && codePoint !== 127 && !'"\\,;'.includes(character)
    })
    .join('')
    .trim()
  return label.slice(0, 100) || fallback
}

const statusFrom = (value: unknown): number | undefined => {
  if (!value || typeof value !== 'object') return undefined

  for (const property of ['responseStatus', 'status', 'statusCode']) {
    const status = (value as Record<string, unknown>)[property]
    if (typeof status === 'number' && Number.isInteger(status)) return status
  }
  return undefined
}

const errorCodeFrom = (value: unknown): string | undefined => {
  if (!value || typeof value !== 'object') return undefined
  const { code } = value as Record<string, unknown>
  return typeof code === 'string' && /^[A-Z0-9_]+$/.test(code) ? code : undefined
}

const connectionReusedFrom = (value: unknown): boolean | undefined => {
  if (!value || typeof value !== 'object') return undefined
  const { request } = value as Record<string, unknown>
  if (!request || typeof request !== 'object') return undefined
  const { req: clientRequest } = request as Record<string, unknown>
  if (!clientRequest || typeof clientRequest !== 'object') return undefined
  const { reusedSocket } = clientRequest as Record<string, unknown>
  return typeof reusedSocket === 'boolean' ? reusedSocket : undefined
}

const isRestClientResponse = (value: unknown): value is RestClientResponse => {
  return Boolean(
    value &&
    typeof value === 'object' &&
    typeof (value as Record<string, unknown>).status === 'number' &&
    'body' in value,
  )
}

const startDownstream = (service: string, method: string, endpoint: string): DownstreamTiming | undefined => {
  const scope = storage.getStore()
  if (!scope) return undefined

  const { request, parentSequence } = scope
  const sequence = request.nextSequence
  request.nextSequence += 1
  const duplicateKey = `${service}|${method}|${endpoint}`
  const duplicateIndex = (request.duplicateCounts.get(duplicateKey) ?? 0) + 1
  request.duplicateCounts.set(duplicateKey, duplicateIndex)
  const startedAt = request.now()

  const timing: DownstreamTiming = {
    sequence,
    ...(parentSequence === undefined ? {} : { parentSequence }),
    concurrentWith: request.downstream
      .filter(call => call.durationMs === undefined && call.parentSequence === parentSequence)
      .map(call => call.sequence),
    duplicateIndex,
    service,
    method,
    endpoint,
    startedAt,
    startMs: roundMilliseconds(startedAt - request.startedAt),
  }
  request.downstream.push(timing)
  return timing
}

const finishDownstream = (
  timing: DownstreamTiming | undefined,
  status: number | undefined,
  error?: unknown,
  connectionReused?: boolean,
): void => {
  if (!timing || timing.durationMs !== undefined) return
  const scope = storage.getStore()
  if (!scope) return

  const completedTiming = timing
  completedTiming.durationMs = roundMilliseconds(scope.request.now() - completedTiming.startedAt)
  completedTiming.status = status
  completedTiming.connectionReused = connectionReused
  completedTiming.errorCode = errorCodeFrom(error)
  completedTiming.outcome = error || (status !== undefined && status >= 400) ? 'failed' : 'completed'
}

const installRestClientTiming = (): void => {
  const prototype = RestClient.prototype as unknown as Record<PropertyKey, unknown>
  if (prototype[installedMarker]) return

  for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
    const original = prototype[method] as RestClientMethod

    prototype[method] = async function timedRestClientMethod(
      this: RestClientInstance,
      request: RestClientRequest,
      authOptions?: unknown,
    ): Promise<unknown> {
      const parentScope = storage.getStore()
      if (!parentScope || !request || typeof request !== 'object') return original.call(this, request, authOptions)

      const service = safeLabel(this.name, 'Downstream service')
      const endpoint = sanitiseDownstreamEndpoint(request.path)
      const timing = startDownstream(service, method.toUpperCase(), endpoint)
      if (!timing) return original.call(this, request, authOptions)

      const originalErrorHandler = request.errorHandler
      const timedRequest: RestClientRequest = { ...request, raw: true }

      if (originalErrorHandler) {
        timedRequest.errorHandler = function timedErrorHandler(path, requestMethod, error) {
          finishDownstream(timing, statusFrom(error), error)
          return originalErrorHandler.call(this, path, requestMethod, error)
        }
      }

      try {
        const result = await storage.run({ request: parentScope.request, parentSequence: timing.sequence }, async () =>
          original.call(this, timedRequest, authOptions),
        )

        if (timing.durationMs !== undefined) return result

        if (isRestClientResponse(result)) {
          finishDownstream(timing, result.status, undefined, connectionReusedFrom(result))
          return request.raw ? result : result.body
        }

        finishDownstream(timing, statusFrom(result))
        return result
      } catch (error) {
        finishDownstream(timing, statusFrom(error), error)
        throw error
      }
    }
  }

  prototype[installedMarker] = true
}

const requestCorrelation = (req: Request, span: ActiveSpan): string => {
  const traceId = span?.spanContext().traceId
  if (traceId && !/^0+$/.test(traceId)) return traceId

  return typeof req.id === 'string' && /^[0-9a-f-]{36}$/i.test(req.id) ? req.id : randomUUID()
}

const isNoisyRequest = (req: Request): boolean => {
  const pathname = req.path
  return noisyPathPrefixes.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
}

const publicDownstreamTiming = (timing: DownstreamTiming) => ({
  sequence: timing.sequence,
  ...(timing.parentSequence === undefined ? {} : { parentSequence: timing.parentSequence }),
  concurrentWith: timing.concurrentWith,
  duplicateIndex: timing.duplicateIndex,
  service: timing.service,
  method: timing.method,
  endpoint: timing.endpoint,
  startMs: timing.startMs,
  durationMs: timing.durationMs,
  status: timing.status,
  ...(timing.connectionReused === undefined ? {} : { connectionReused: timing.connectionReused }),
  ...(timing.errorCode ? { errorCode: timing.errorCode } : {}),
  outcome: timing.outcome ?? 'aborted',
})

const publicRenderTiming = (timing: RenderTiming) => ({
  sequence: timing.sequence,
  view: timing.view,
  startMs: timing.startMs,
  durationMs: timing.durationMs,
  outcome: timing.outcome ?? 'aborted',
})

const buildServerTimingHeader = (timing: RequestTiming): string => {
  const entries = [`total;dur=${roundMilliseconds(timing.now() - timing.startedAt)}`]
  const appendEntry = (entry: string) => {
    if (`${entries.join(', ')}, ${entry}`.length <= serverTimingHeaderMaxLength) entries.push(entry)
  }

  timing.downstream.slice(0, 20).forEach(call => {
    if (call.durationMs !== undefined) {
      appendEntry(`api-${call.sequence};dur=${call.durationMs};desc="${call.service} ${call.method} ${call.endpoint}"`)
    }
  })

  timing.renders.forEach(render => {
    if (render.durationMs !== undefined) {
      appendEntry(`render-${render.sequence};dur=${render.durationMs};desc="Nunjucks ${render.view}"`)
    }
  })

  return entries.join(', ')
}

const instrumentRendering = (req: Request, res: Response, timing: RequestTiming): void => {
  const originalRender = res.render.bind(res)
  const requestTiming = timing

  res.render = ((
    view: string,
    options?: object | ((err: Error, html: string) => void),
    callback?: (err: Error, html: string) => void,
  ) => {
    requestTiming.route = normaliseExpressRoute(req)
    const startedAt = requestTiming.now()
    const render: RenderTiming = {
      sequence: requestTiming.nextSequence,
      view: safeLabel(view, 'unknown-view'),
      startedAt,
      startMs: roundMilliseconds(startedAt - requestTiming.startedAt),
    }
    requestTiming.nextSequence += 1
    requestTiming.renders.push(render)
    let recorded = false

    const suppliedCallback = typeof options === 'function' ? options : callback
    const renderOptions = typeof options === 'function' ? undefined : options
    const finishRender = (error: Error, html: string) => {
      if (!recorded) {
        recorded = true
        render.durationMs = roundMilliseconds(requestTiming.now() - startedAt)
        render.outcome = error ? 'failed' : 'completed'
        requestTiming.serverSpan?.addEvent('nunjucks.render', {
          'nunjucks.view': render.view,
          'nunjucks.duration_ms': render.durationMs,
          'nunjucks.outcome': render.outcome,
        })
      }

      if (suppliedCallback) return suppliedCallback(error, html)
      if (error) return req.next(error)
      return res.send(html)
    }

    try {
      if (renderOptions === undefined) return originalRender(view, finishRender)
      return originalRender(view, renderOptions, finishRender)
    } catch (error) {
      if (recorded) throw error
      finishRender(error as Error, '')
      return undefined
    }
  }) as Response['render']
}

export default function serverRequestTiming({
  enabled,
  serverTimingHeader: includeServerTimingHeader = false,
  timingLogger = logger,
  now = performance.now.bind(performance),
}: ServerRequestTimingOptions): RequestHandler {
  if (!enabled || process.env.NODE_ENV === 'production') return (_req, _res, next) => next()

  installRestClientTiming()

  return (req, res, next) => {
    if (isNoisyRequest(req)) return next()

    const startedAt = now()
    const serverSpan = trace.getActiveSpan()
    const timing: RequestTiming = {
      startedAt,
      now,
      correlationId: requestCorrelation(req, serverSpan),
      serverSpan,
      nextSequence: 1,
      downstream: [],
      renders: [],
      duplicateCounts: new Map(),
    }
    let finished = false
    let headerAdded = false

    const captureRoute = () => {
      timing.route ??= normaliseExpressRoute(req)
    }

    const addServerTimingHeader = () => {
      if (!includeServerTimingHeader || headerAdded || res.headersSent) return
      headerAdded = true
      const existing = res.getHeader('Server-Timing')
      const value = buildServerTimingHeader(timing)
      res.setHeader('Server-Timing', existing ? `${existing}, ${value}` : value)
    }

    // Compression commits headers before delegating to res.end, so hook writeHead instead.
    const originalWriteHead = res.writeHead.bind(res)
    res.writeHead = ((...args: Parameters<Response['writeHead']>) => {
      captureRoute()
      addServerTimingHeader()
      return originalWriteHead(...args)
    }) as Response['writeHead']

    instrumentRendering(req, res, timing)

    const finish = (outcome: TimingOutcome) => {
      if (finished) return
      finished = true

      const durationMs = roundMilliseconds(now() - startedAt)
      const status = res.statusCode
      const finalOutcome = outcome === 'completed' && status >= 400 ? 'failed' : outcome
      const route = timing.route ?? normaliseExpressRoute(req)
      const finishedAt = now()
      timing.downstream.forEach(call => {
        if (call.durationMs === undefined) {
          Object.assign(call, {
            durationMs: roundMilliseconds(finishedAt - call.startedAt),
            outcome: 'aborted' as const,
          })
        }
      })
      timing.renders.forEach(render => {
        if (render.durationMs === undefined) {
          Object.assign(render, {
            durationMs: roundMilliseconds(finishedAt - render.startedAt),
            outcome: 'aborted' as const,
          })
        }
      })
      const renderDurationMs = roundMilliseconds(
        timing.renders.reduce((total, render) => total + (render.durationMs ?? 0), 0),
      )

      timing.serverSpan?.setAttributes({
        'nunjucks.total_duration_ms': renderDurationMs,
        'app.downstream_call_count': timing.downstream.length,
      })

      timingLogger.info(
        {
          event: 'server_request_timing',
          request: {
            method: req.method,
            route,
            status,
            outcome: finalOutcome,
            durationMs,
            correlationId: timing.correlationId,
          },
          downstream: timing.downstream.map(publicDownstreamTiming),
          renders: timing.renders.map(publicRenderTiming),
        },
        'Server request timing',
      )
    }

    res.once('finish', () => finish('completed'))
    res.once('close', () => finish(res.writableFinished ? 'completed' : 'aborted'))
    res.once('error', () => finish('failed'))
    req.once('aborted', () => finish('aborted'))

    return storage.run({ request: timing }, next)
  }
}
