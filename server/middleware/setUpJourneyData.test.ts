import { Request, RequestHandler, Response } from 'express'
import { randomUUID } from 'crypto'
import setUpJourneyData from './setUpJourneyData'
import TokenStoreInterface from '../data/tokenStoreInterface'
import populateJourney from './populateJourney'
import {
  AppointmentJourney,
  AppointmentJourneyMode,
  AppointmentType,
} from '../routes/appointments/create-and-edit/appointmentJourney'

let middleware: RequestHandler

let req: Request
let res: Response
let tokenStore: TokenStoreInterface

let journeyId: string

const next = jest.fn()

const appointmentJourney: AppointmentJourney = {
  mode: AppointmentJourneyMode.CREATE,
  type: AppointmentType.GROUP,
  appointmentName: 'Gym appointment',
}

beforeEach(() => {
  next.mockReset()
  journeyId = randomUUID()

  res = {
    callback: () => null,
    redirect: jest.fn(),
    prependOnceListener: (_: string, cb: () => void) => {
      // @ts-expect-error null object
      this.callback = cb
    },
    send: () => {
      // @ts-expect-error null object
      this.callback()
    },
    locals: {},
  } as unknown as Response

  req = {
    user: { username: 'tester' },
    session: {},
    params: { journeyId },
  } as unknown as Request

  tokenStore = {
    getToken: jest.fn().mockResolvedValue(null),
    setToken: jest.fn(),
    setTokenAndEmit: jest.fn(),
    delToken: jest.fn(),
  }
})

describe('setUpJourneyData', () => {
  it('should create a new journey data when no key is stored', async () => {
    middleware = setUpJourneyData(tokenStore)

    expect(req.journeyData).toBeUndefined()
    await middleware(req, res, next)
    expect(req.journeyData).not.toBeUndefined()
  })

  it('should read journey data from store', async () => {
    tokenStore.getToken = jest.fn().mockResolvedValue('{ "movementListJourney" : { "date": "2025-02-24" } }')

    middleware = setUpJourneyData(tokenStore)

    await middleware(req, res, next)
    expect(req.journeyData.movementListJourney!.date).toEqual('2025-02-24')
  })

  describe('appointment journey migration fallback', () => {
    beforeEach(async () => {
      await populateJourney()(req, res, jest.fn())
      middleware = setUpJourneyData(tokenStore, { preserveLegacyAppointmentJourney: true })
    })

    it('recovers an in-progress journey from the legacy session when it is absent from the cache', async () => {
      req.session.appointmentJourney = appointmentJourney

      await middleware(req, res, next)

      expect(req.journeyData.appointmentJourney).toEqual(appointmentJourney)
      expect(res.locals.appointmentJourney).toEqual(appointmentJourney)
      expect(next).toHaveBeenCalledWith()
    })

    it('uses the cached journey as authoritative and copies it to the legacy session', async () => {
      const cachedAppointmentJourney = { ...appointmentJourney, appointmentName: 'Cached appointment' }
      req.session.appointmentJourney = appointmentJourney
      tokenStore.getToken = jest.fn().mockResolvedValue(
        JSON.stringify({
          appointmentJourney: cachedAppointmentJourney,
        }),
      )

      await middleware(req, res, next)

      expect(req.journeyData.appointmentJourney).toEqual(cachedAppointmentJourney)
      expect(req.session.appointmentJourney).toEqual(cachedAppointmentJourney)
    })

    it('does not resurrect a completed journey when the cache has cleared it', async () => {
      req.session.appointmentJourney = appointmentJourney
      tokenStore.getToken = jest.fn().mockResolvedValue(JSON.stringify({ appointmentJourney: null }))

      await middleware(req, res, next)

      expect(req.journeyData.appointmentJourney).toBeNull()
      expect(req.session.appointmentJourney).toBeNull()
    })

    it('keeps new journey updates in both journey data and the legacy session', async () => {
      await middleware(req, res, next)

      req.journeyData.appointmentJourney = appointmentJourney

      expect(req.session.appointmentJourney).toEqual(appointmentJourney)
      expect(JSON.parse(JSON.stringify(req.journeyData)).appointmentJourney).toEqual(appointmentJourney)
    })

    it('recovers from a cache outage when the legacy session contains the journey', async () => {
      req.session.appointmentJourney = appointmentJourney
      tokenStore.getToken = jest.fn().mockRejectedValue(new Error('Redis unavailable'))

      await middleware(req, res, next)

      expect(req.journeyData.appointmentJourney).toEqual(appointmentJourney)
      expect(next).toHaveBeenCalledWith()
    })
  })

  it.each(['not-json', 'null', '[]'])(
    'fails closed without replacing invalid cached journey data: %s',
    async cached => {
      tokenStore.getToken = jest.fn().mockResolvedValue(cached)
      middleware = setUpJourneyData(tokenStore)

      await middleware(req, res, next)

      expect(next).toHaveBeenCalledWith(expect.any(Error))
      expect(req.journeyData).toBeUndefined()
    },
  )

  it('fails closed when the cache cannot be read and there is no legacy fallback', async () => {
    tokenStore.getToken = jest.fn().mockRejectedValue(new Error('Redis unavailable'))
    middleware = setUpJourneyData(tokenStore)

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledWith(expect.any(Error))
    expect(req.journeyData).toBeUndefined()
  })
})
