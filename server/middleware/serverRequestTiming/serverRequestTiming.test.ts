import path from 'node:path'
import compression from 'compression'
import express from 'express'
import nock from 'nock'
import request from 'supertest'
import { RestClient } from '@ministryofjustice/hmpps-rest-client'
import { trace } from '@ministryofjustice/hmpps-azure-telemetry'
import serverRequestTiming from './serverRequestTiming'

const apiConfig = {
  url: 'http://timing-api.local',
  timeout: { response: 1_000, deadline: 1_000 },
  agent: { timeout: 1_000 },
}

const clientLogger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}

describe('serverRequestTiming middleware', () => {
  const timingLogger = { info: jest.fn() }

  beforeEach(() => {
    timingLogger.info.mockClear()
    clientLogger.debug.mockClear()
    clientLogger.warn.mockClear()
    nock.cleanAll()
  })

  afterEach(() => jest.restoreAllMocks())

  afterAll(() => nock.restore())

  const loggedTiming = () => timingLogger.info.mock.calls[0][0]

  it('has no timing overhead or output when disabled', async () => {
    const app = express()
    app.use(serverRequestTiming({ enabled: false, serverTimingHeader: true, timingLogger }))
    app.get('/allocations/:allocationId', (_req, res) => res.sendStatus(204))

    const response = await request(app).get('/allocations/123?prisonerNumber=A1234BC').expect(204)

    expect(response.headers['server-timing']).toBeUndefined()
    expect(timingLogger.info).not.toHaveBeenCalled()
  })

  it('cannot be enabled in production', async () => {
    const originalNodeEnvironment = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'

    try {
      const app = express()
      app.use(serverRequestTiming({ enabled: true, serverTimingHeader: true, timingLogger }))
      app.get('/allocations/:allocationId', (_req, res) => res.sendStatus(204))

      const response = await request(app).get('/allocations/123').expect(204)

      expect(response.headers['server-timing']).toBeUndefined()
      expect(timingLogger.info).not.toHaveBeenCalled()
    } finally {
      process.env.NODE_ENV = originalNodeEnvironment
    }
  })

  it('logs a completed page request using its normalised Express route', async () => {
    const app = express()
    app.use(serverRequestTiming({ enabled: true, serverTimingHeader: true, timingLogger }))
    app.get('/allocations/:allocationId/prisoner/:prisonerNumber', (_req, res) => res.sendStatus(200))

    const response = await request(app).get('/allocations/123/prisoner/A1234BC?token=do-not-log').expect(200)

    expect(response.headers['server-timing']).toMatch(/^total;dur=\d/)
    expect(loggedTiming()).toMatchObject({
      event: 'server_request_timing',
      request: {
        method: 'GET',
        route: '/allocations/:allocationId/prisoner/:prisonerNumber',
        status: 200,
        outcome: 'completed',
        durationMs: expect.any(Number),
        correlationId: expect.stringMatching(/^[0-9a-f-]{36}$/),
      },
      downstream: [],
      renders: [],
    })
    expect(JSON.stringify(loggedTiming())).not.toContain('A1234BC')
    expect(JSON.stringify(loggedTiming())).not.toContain('do-not-log')
  })

  it('retains named parameters from nested Express routers', async () => {
    const app = express()
    const childRouter = express.Router({ mergeParams: true })
    app.use(serverRequestTiming({ enabled: true, timingLogger }))
    childRouter.get('/start-date', (_req, res) => res.sendStatus(200))
    app.use('/activities/allocations/edit/:allocationId/:journeyId', childRouter)

    await request(app)
      .get('/activities/allocations/edit/123/0d813283-1d70-4048-85ec-9b6509f9f9a0/start-date')
      .expect(200)

    expect(loggedTiming().request.route).toBe('/activities/allocations/edit/:allocationId/:journeyId/start-date')
  })

  it('does not log unrecognised segments from an unmatched request path', async () => {
    const app = express()
    app.use(serverRequestTiming({ enabled: true, timingLogger }))
    app.use((_req, res) => res.sendStatus(404))

    await request(app).get('/john-smith?token=do-not-log').expect(404)

    expect(loggedTiming().request).toMatchObject({
      route: '/:value',
      status: 404,
      outcome: 'failed',
    })
    expect(JSON.stringify(loggedTiming())).not.toContain('john-smith')
    expect(JSON.stringify(loggedTiming())).not.toContain('do-not-log')
  })

  it('records sanitised, concurrent and duplicate downstream calls with their statuses', async () => {
    const client = new RestClient('Activities Management API', apiConfig, clientLogger as unknown as Console)
    nock(apiConfig.url).get('/activities/123').query({ prisonerNumber: 'A1234BC' }).thrice().delay(10).reply(200, {})

    const app = express()
    app.use(serverRequestTiming({ enabled: true, serverTimingHeader: true, timingLogger }))
    app.get('/allocation/:allocationId', async (req, res) => {
      await Promise.all([
        client.get({ path: `/activities/${req.params.allocationId}`, query: { prisonerNumber: 'A1234BC' } }),
        client.get({ path: `/activities/${req.params.allocationId}`, query: { prisonerNumber: 'A1234BC' } }),
      ])
      await client.get({ path: `/activities/${req.params.allocationId}`, query: { prisonerNumber: 'A1234BC' } })
      res.sendStatus(200)
    })

    const response = await request(app).get('/allocation/123').expect(200)
    const { downstream } = loggedTiming()

    expect(downstream).toEqual([
      expect.objectContaining({
        sequence: 1,
        concurrentWith: [],
        duplicateIndex: 1,
        service: 'Activities Management API',
        method: 'GET',
        endpoint: '/activities/:id',
        status: 200,
        connectionReused: false,
        outcome: 'completed',
      }),
      expect.objectContaining({
        sequence: 2,
        concurrentWith: [1],
        duplicateIndex: 2,
        service: 'Activities Management API',
        method: 'GET',
        endpoint: '/activities/:id',
        status: 200,
        outcome: 'completed',
      }),
      expect.objectContaining({
        sequence: 3,
        concurrentWith: [],
        duplicateIndex: 3,
        service: 'Activities Management API',
        method: 'GET',
        endpoint: '/activities/:id',
        status: 200,
        outcome: 'completed',
      }),
    ])
    expect(downstream[0].durationMs).toBeGreaterThan(0)
    expect(downstream[1].startMs).toBeGreaterThanOrEqual(downstream[0].startMs)
    expect(downstream[2].startMs).toBeGreaterThanOrEqual(downstream[0].startMs + downstream[0].durationMs)
    expect(response.headers['server-timing']).toContain('desc="Activities Management API GET /activities/:id"')
    expect(JSON.stringify(loggedTiming())).not.toContain('A1234BC')
  })

  it('records failed downstream and page responses without logging identifiers or query parameters', async () => {
    const client = new RestClient('Prisoner Search API', apiConfig, clientLogger as unknown as Console)
    nock(apiConfig.url).get('/prisoner/A1234BC').query({ token: 'secret-token' }).reply(503, { error: 'failed' })

    const app = express()
    app.use(serverRequestTiming({ enabled: true, timingLogger }))
    app.get('/attendance/:prisonerNumber', async (_req, res, next) => {
      try {
        await client.get({ path: '/prisoner/A1234BC', query: { token: 'secret-token' }, retries: 0 })
        res.sendStatus(200)
      } catch (error) {
        next(error)
      }
    })
    app.use((_error, _req, res, _next) => res.status(500).send('failed'))

    await request(app).get('/attendance/A1234BC?another=secret').expect(500)

    expect(loggedTiming()).toMatchObject({
      request: {
        route: '/attendance/:prisonerNumber',
        status: 500,
        outcome: 'failed',
      },
      downstream: [
        expect.objectContaining({
          service: 'Prisoner Search API',
          endpoint: '/prisoner/:value',
          status: 503,
          outcome: 'failed',
        }),
      ],
    })
    const output = JSON.stringify(loggedTiming())
    expect(output).not.toContain('A1234BC')
    expect(output).not.toContain('secret')
  })

  it('records Nunjucks render duration and includes it in Server-Timing', async () => {
    const activeSpan = {
      spanContext: () => ({ traceId: '0af7651916cd43dd8448eb211c80319c' }),
      addEvent: jest.fn(),
      setAttributes: jest.fn(),
    } as unknown as NonNullable<ReturnType<typeof trace.getActiveSpan>>
    jest.spyOn(trace, 'getActiveSpan').mockReturnValue(activeSpan)
    const app = express()
    app.engine('njk', (_file, _options, callback) => setTimeout(() => callback(null, '<p>rendered</p>'), 5))
    app.set('view engine', 'njk')
    app.set('views', path.join(process.cwd(), 'server/views'))
    app.use(serverRequestTiming({ enabled: true, serverTimingHeader: true, timingLogger }))
    app.get('/attendance/:instanceId', (_req, res) => res.render('pages/error'))

    const response = await request(app).get('/attendance/456').expect(200)
    const { renders } = loggedTiming()

    expect(renders).toEqual([
      expect.objectContaining({
        sequence: 1,
        view: 'pages/error',
        durationMs: expect.any(Number),
        outcome: 'completed',
      }),
    ])
    expect(renders[0].durationMs).toBeGreaterThan(0)
    expect(response.headers['server-timing']).toContain('desc="Nunjucks pages/error"')
    expect(loggedTiming().request.correlationId).toBe('0af7651916cd43dd8448eb211c80319c')
    expect(activeSpan.addEvent).toHaveBeenCalledWith(
      'nunjucks.render',
      expect.objectContaining({
        'nunjucks.view': 'pages/error',
        'nunjucks.duration_ms': expect.any(Number),
        'nunjucks.outcome': 'completed',
      }),
    )
    expect(activeSpan.setAttributes).toHaveBeenCalledWith({
      'nunjucks.total_duration_ms': expect.any(Number),
      'app.downstream_call_count': 0,
    })
  })

  it('adds Server-Timing before response compression commits the headers', async () => {
    const app = express()
    app.use(serverRequestTiming({ enabled: true, serverTimingHeader: true, timingLogger }))
    app.use(compression())
    app.get('/attendance/:instanceId', (_req, res) => res.send('rendered'.repeat(256)))

    const response = await request(app).get('/attendance/456').set('Accept-Encoding', 'br').expect(200)

    expect(response.headers['content-encoding']).toBe('br')
    expect(response.headers['server-timing']).toMatch(/^total;dur=\d/)
  })

  it('records a failed Nunjucks render and the resulting failed response', async () => {
    const app = express()
    app.engine('njk', (_file, _options, callback) => callback(new Error('Template failed')))
    app.set('view engine', 'njk')
    app.set('views', path.join(process.cwd(), 'server/views'))
    app.use(serverRequestTiming({ enabled: true, timingLogger }))
    app.get('/allocation/:allocationId', (_req, res) => res.render('pages/error'))
    app.use((_error, _req, res, _next) => res.status(500).send('failed'))

    await request(app).get('/allocation/123').expect(500)

    expect(loggedTiming()).toMatchObject({
      request: {
        route: '/allocation/:allocationId',
        status: 500,
        outcome: 'failed',
      },
      renders: [
        expect.objectContaining({
          view: 'pages/error',
          outcome: 'failed',
        }),
      ],
    })
  })

  it('records a prematurely closed request once as aborted', async () => {
    const app = express()
    app.use(serverRequestTiming({ enabled: true, timingLogger }))
    app.get('/allocation/:allocationId', (_req, res) => res.destroy())

    await expect(request(app).get('/allocation/123')).rejects.toThrow()

    expect(timingLogger.info).toHaveBeenCalledTimes(1)
    expect(loggedTiming()).toMatchObject({
      request: {
        route: '/allocation/:allocationId',
        outcome: 'aborted',
      },
    })
  })

  it('excludes noisy infrastructure routes', async () => {
    const app = express()
    app.use(serverRequestTiming({ enabled: true, timingLogger }))
    app.get('/health', (_req, res) => res.json({ status: 'UP' }))

    await request(app).get('/health').expect(200)

    expect(timingLogger.info).not.toHaveBeenCalled()
  })
})
