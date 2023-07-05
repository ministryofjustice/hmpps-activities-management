import { Request, Response } from 'express'
import startNewJourney from './startNewJourney'

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

describe('startNewJourney', () => {
  it('should generate a new journey id, replace supplied create url segment and redirect', async () => {
    const middleware = startNewJourney('/create/')
    req.originalUrl = '/appointments/create/start-individual'

    middleware(req, res)

    expect(res.redirect).toBeCalledWith(
      expect.stringMatching(
        /\/appointments\/create\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/start-individual/,
      ),
    )
  })

  it('should generate a new journey id, replace supplied / url segment and redirect', async () => {
    const middleware = startNewJourney('/')
    req.originalUrl = '/appointments/create/start-individual'

    middleware(req, res)

    expect(res.redirect).toBeCalledWith(
      expect.stringMatching(
        /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/appointments\/create\/start-individual/,
      ),
    )
  })

  it('should redirect to original url without adding a journey id if url segment not found', async () => {
    const middleware = startNewJourney('/not-create/')
    req.originalUrl = '/appointments/create/start-individual'

    middleware(req, res)

    expect(res.redirect).toBeCalledWith('/appointments/create/start-individual')
  })

  it('should redirect to original url without adding a journey id if url segment undefined', async () => {
    const middleware = startNewJourney(undefined)
    req.originalUrl = '/appointments/create/start-individual'

    middleware(req, res)

    expect(res.redirect).toBeCalledWith('/appointments/create/start-individual')
  })

  it('should redirect to original url without adding a journey id if url segment null', async () => {
    const middleware = startNewJourney(null)
    req.originalUrl = '/appointments/create/start-individual'

    middleware(req, res)

    expect(res.redirect).toBeCalledWith('/appointments/create/start-individual')
  })

  it('should redirect to original url without adding a journey id if url segment empty', async () => {
    const middleware = startNewJourney('')
    req.originalUrl = '/appointments/create/start-individual'

    middleware(req, res)

    expect(res.redirect).toBeCalledWith('/appointments/create/start-individual')
  })
})
