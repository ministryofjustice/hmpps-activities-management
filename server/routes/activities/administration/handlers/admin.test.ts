import { Request, Response } from 'express'
import AdministrationRoutes from './administration'

jest.mock('../../../../services/activitiesService')

describe('Route Handlers - Admin homepage', () => {
  const handler = new AdministrationRoutes()
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
    } as unknown as Response

    req = {
      params: {},
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should render admin homepage', async () => {
      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/activities/administration/admin', {})
    })
  })
})
