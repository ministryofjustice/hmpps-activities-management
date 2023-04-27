import { Request, Response } from 'express'

import ChangeLocationRoutes from './changeLocation'
import UserService from '../../../services/userService'

jest.mock('../../../services/userService')

const userService = new UserService(null, null, null, null) as jest.Mocked<UserService>

describe('Route Handlers - Change location', () => {
  const handler = new ChangeLocationRoutes(userService)
  let req: Request
  let res: Response

  beforeEach(() => {
    res = {
      locals: {
        user: {},
      },
      render: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response

    req = {
      get: jest.fn(),
      originalUrl: '/change-location',
      session: {},
    } as unknown as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('GET', () => {
    it('should redirect back if user has less than 2 prisons in their caseload', async () => {
      res.locals.user.allCaseLoads = [{ caseLoadId: 'LEI', description: 'Leeds (HMP)' }]
      await handler.GET(req, res)
      expect(res.redirect).toHaveBeenCalledWith('back')
    })

    it('should render view with correct context', async () => {
      res.locals.user.allCaseLoads = [
        { caseLoadId: 'MDI', description: 'Moorland (HMP)' },
        { caseLoadId: 'LEI', description: 'Leeds (HMP)' },
      ]

      await handler.GET(req, res)

      expect(res.render).toHaveBeenCalledWith('pages/change-location/index', {
        options: [
          { value: 'MDI', text: 'Moorland (HMP)' },
          { value: 'LEI', text: 'Leeds (HMP)' },
        ],
      })
    })
  })

  describe('POST', () => {
    it('should set the active caseload and redirect to root', async () => {
      req.body = {
        caseLoadId: 'MDI',
      }

      await handler.POST(req, res)
      expect(userService.setActiveCaseLoad).toHaveBeenCalledWith('MDI', res.locals.user)
      expect(res.redirect).toHaveBeenCalledWith('/')
    })
  })
})
