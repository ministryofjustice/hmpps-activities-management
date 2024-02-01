import { Request, Response } from 'express'
import appointmentsStartNewJourney from './appointmentsStartNewJourney'

let req: Request
let res: Response

beforeEach(() => {
  res = {
    redirect: jest.fn(),
  } as unknown as Response

  req = {
    originalUrl: '',
  } as unknown as Request
})

describe('appointmentsStartNewJourney', () => {
  it('should generate a new journey id, replace supplied create url segment and redirect', async () => {
    const middleware = appointmentsStartNewJourney('/create/')
    req.originalUrl = '/appointments/create/start-group'

    middleware(req, res)

    expect(res.redirect).toBeCalledWith(
      expect.stringMatching(
        /\/appointments\/create\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/start-group/,
      ),
    )
  })

  it('should generate a new journey id, replace supplied / url segment and redirect', async () => {
    const middleware = appointmentsStartNewJourney('/')
    req.originalUrl = '/appointments/create/start-group'

    middleware(req, res)

    expect(res.redirect).toBeCalledWith(
      expect.stringMatching(
        /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/appointments\/create\/start-group/,
      ),
    )
  })

  it('should redirect to original url without adding a journey id if url segment not found', async () => {
    const middleware = appointmentsStartNewJourney('/not-create/')
    req.originalUrl = '/appointments/create/start-group'

    middleware(req, res)

    expect(res.redirect).toBeCalledWith('/appointments/create/start-group')
  })

  it('should redirect to original url without adding a journey id if url segment undefined', async () => {
    const middleware = appointmentsStartNewJourney(undefined)
    req.originalUrl = '/appointments/create/start-group'

    middleware(req, res)

    expect(res.redirect).toBeCalledWith('/appointments/create/start-group')
  })

  it('should redirect to original url without adding a journey id if url segment null', async () => {
    const middleware = appointmentsStartNewJourney(null)
    req.originalUrl = '/appointments/create/start-group'

    middleware(req, res)

    expect(res.redirect).toBeCalledWith('/appointments/create/start-group')
  })

  it('should redirect to original url without adding a journey id if url segment empty', async () => {
    const middleware = appointmentsStartNewJourney('')
    req.originalUrl = '/appointments/create/start-group'

    middleware(req, res)

    expect(res.redirect).toBeCalledWith('/appointments/create/start-group')
  })
})
