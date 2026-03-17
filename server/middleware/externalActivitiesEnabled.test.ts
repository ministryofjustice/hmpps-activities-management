import { Request, Response } from 'express'
import { Session, SessionData } from 'express-session'
import externalActivitiesEnabled from './externalActivitiesEnabled'

jest.mock('../../logger')

describe('externalActivitiesEnabled', () => {
  let req: Partial<Request>
  let res: Partial<Response>
  let next: jest.Mock
  const externalActivitiesEnabledMiddleware = externalActivitiesEnabled()

  beforeEach(() => {
    jest.clearAllMocks()

    req = {
      session: {
        user: {
          username: 'TEST_USER',
          activeCaseLoadId: undefined,
        },
      } as Session & Partial<SessionData>,
    }

    res = {}
    next = jest.fn()
  })

  describe('when user has an enabled caseload', () => {
    // TODO Refactor to mock API call when implemented
    it('should set isExternalActivitiesEnabled to true', async () => {
      req.session.user = { ...req.session.user, activeCaseLoadId: 'HVI' }

      await externalActivitiesEnabledMiddleware(req as Request, res as Response, next)

      expect(req.session.user.isExternalActivitiesEnabled).toBe(true)
      expect(next).toHaveBeenCalled()
    })
  })

  describe('when user has a disabled caseload', () => {
    it('should set isExternalActivitiesEnabled to false for MDI', async () => {
      req.session.user = { ...req.session.user, activeCaseLoadId: 'XXI' }

      await externalActivitiesEnabledMiddleware(req as Request, res as Response, next)

      expect(req.session.user.isExternalActivitiesEnabled).toBe(false)
      expect(next).toHaveBeenCalled()
    })
  })

  describe('when user has no active caseload', () => {
    it('should set isExternalActivitiesEnabled to false and log warning', async () => {
      req.session.user = { ...req.session.user, activeCaseLoadId: undefined }

      await externalActivitiesEnabledMiddleware(req as Request, res as Response, next)

      expect(req.session.user.isExternalActivitiesEnabled).toBe(false)
      expect(next).toHaveBeenCalled()
    })

    it('should set isExternalActivitiesEnabled to false when session user does not exist', async () => {
      req.session.user = undefined

      await externalActivitiesEnabledMiddleware(req as Request, res as Response, next)

      expect(next).toHaveBeenCalled()
    })
  })

  describe('session updates', () => {
    it('should preserve other user properties when adding flag', async () => {
      const originalUser = {
        username: 'TEST_USER',
        activeCaseLoadId: 'HVI',
        token: 'test-token',
        authSource: 'nomis',
      }

      req.session.user = originalUser

      await externalActivitiesEnabledMiddleware(req as Request, res as Response, next)

      expect(req.session.user).toEqual({
        ...originalUser,
        isExternalActivitiesEnabled: true,
      })
    })
  })
})
