import { Request, RequestHandler, Response } from 'express'
import { randomUUID } from 'crypto'
import setUpJourneyData from './setUpJourneyData'
import TokenStoreInterface from '../data/tokenStoreInterface'

let middleware: RequestHandler

let req: Request
let res: Response
let tokenStore: TokenStoreInterface

let journeyId: string

const next = jest.fn()

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
