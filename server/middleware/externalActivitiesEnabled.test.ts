import { Request, Response } from 'express'
import externalActivitiesEnabled from './externalActivitiesEnabled'

jest.mock('../../logger')

describe('externalActivitiesEnabled', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: jest.Mock
  const externalActivitiesEnabledMiddleware = externalActivitiesEnabled()

  beforeEach(() => {
    jest.clearAllMocks()

    req = {}

    res = {
      locals: {
        user: {
          username: 'TEST_USER',
          activeCaseLoadId: undefined,
        },
        isExternalActivitiesEnabled: undefined,
      },
    } as unknown as Partial<Response>
    next = jest.fn()
  })

  describe('when user has an enabled caseload', () => {
    // TODO Refactor to mock API call when implemented
    it('should set isExternalActivitiesEnabled to true', async () => {
      res.locals.user.activeCaseLoadId = 'HVI'

      await externalActivitiesEnabledMiddleware(req as Request, res as Response, next)

      expect(res.locals.isExternalActivitiesEnabled).toBe(true)
      expect(next).toHaveBeenCalled()
    })
  })

  describe('when user has a disabled caseload', () => {
    it('should set isExternalActivitiesEnabled to false for MDI', async () => {
      res.locals.user.activeCaseLoadId = 'XXI'

      await externalActivitiesEnabledMiddleware(req as Request, res as Response, next)

      expect(res.locals.isExternalActivitiesEnabled).toBe(false)
      expect(next).toHaveBeenCalled()
    })
  })

  describe('when user has no active caseload', () => {
    it('should set isExternalActivitiesEnabled to false and log warning', async () => {
      res.locals.user.activeCaseLoadId = undefined

      await externalActivitiesEnabledMiddleware(req as Request, res as Response, next)

      expect(res.locals.isExternalActivitiesEnabled).toBe(false)
      expect(next).toHaveBeenCalled()
    })

    it('should set isExternalActivitiesEnabled to false when user does not exist', async () => {
      res.locals.user = undefined

      await externalActivitiesEnabledMiddleware(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
    })
  })
})
