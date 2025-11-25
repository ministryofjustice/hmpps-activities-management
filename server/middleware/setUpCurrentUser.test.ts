import express, { NextFunction, Request, Response } from 'express'
import request from 'supertest'
import { Session, SessionData } from 'express-session'
import { when } from 'jest-when'
import setUpCurrentUser from './setUpCurrentUser'
import ActivitiesService from '../services/activitiesService'
import auth from '../authentication/auth'
import { RolloutPrisonPlan } from '../@types/activitiesAPI/types'

jest.mock('../services/activitiesService')
jest.mock('jwt-decode')
jest.mock('../authentication/auth')

const username = 'BLOGGSJ'

const activitiesServiceMock = new ActivitiesService(null) as jest.Mocked<ActivitiesService>

auth.authenticationMiddleware = jest.fn().mockReturnValue((req: Request, res: Response, next: NextFunction) => {
  next()
})

jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn().mockReturnValue({
    name: 'J Bloggs',
    user_id: '1234',
    authorities: ['ROLE_A', 'ROLE_B'],
  }),
}))

describe('setUpCurrentUser', () => {
  let app
  let testReq: Request
  let testRes: Response

  beforeEach(() => {
    when(activitiesServiceMock.getPrisonRolloutPlan)
      .calledWith('RSI')
      .mockResolvedValue({
        activitiesRolledOut: true,
        appointmentsRolledOut: false,
      } as RolloutPrisonPlan)

    app = express()
  })

  afterEach(() => {
    activitiesServiceMock.getPrisonRolloutPlan.mockReset()
  })

  it('updates the user details when the active case load has changed', async () => {
    app.use((req: Request, res: Response, next: NextFunction) => {
      req.user = { username } as Express.User
      req.session = {
        user: {
          activeCaseLoadId: 'MDI',
        },
      } as Session & Partial<SessionData>
      res.locals = {
        user: {
          token: 'web-token',
          authSource: 'nomis',
          activeCaseLoad: {
            caseLoadId: 'RSI',
          },
        },
      }
      res.render = jest.fn()
      next()
    })

    app.use(setUpCurrentUser(activitiesServiceMock))

    app.get('/path', (req, res) => {
      testReq = req
      testRes = res

      res.render('view', {})
      res.sendStatus(200)
    })

    const response = await request(app).get(`/path`)

    const expectedUserDetails = {
      authSource: 'nomis',
      name: 'J Bloggs',
      roles: ['ROLE_A', 'ROLE_B'],
      staffId: 1234,
      token: 'web-token',
      userId: '1234',
      displayName: 'J Bloggs',
      activeCaseLoad: {
        caseLoadId: 'RSI',
      },
      isActivitiesRolledOut: true,
      isAppointmentsRolledOut: false,
    }

    expect(testReq.session.user).toEqual(expectedUserDetails)

    expect(testRes.locals.user).toEqual(expectedUserDetails)

    expect(activitiesServiceMock.getPrisonRolloutPlan).toHaveBeenCalledWith('RSI')

    expect(response.status).toBe(200)
  })

  it('does not update the user details when the active case load has not changed', async () => {
    app.use((req: Request, res: Response, next: NextFunction) => {
      req.user = { username } as Express.User
      req.session = {
        user: {
          activeCaseLoadId: 'RSI',
          isActivitiesRolledOut: false,
          isAppointmentsRolledOut: true,
        },
      } as Session & Partial<SessionData>
      res.locals = {
        user: {
          token: 'web-token',
          authSource: 'nomis',
          activeCaseLoad: {
            caseLoadId: 'RSI',
          },
        },
      }
      res.render = jest.fn()
      next()
    })

    app.use(setUpCurrentUser(activitiesServiceMock))

    app.get('/path', (req, res) => {
      testReq = req
      testRes = res

      res.render('view', {})
      res.sendStatus(200)
    })

    const response = await request(app).get(`/path`)

    const expectedUserDetails = {
      authSource: 'nomis',
      name: 'J Bloggs',
      roles: ['ROLE_A', 'ROLE_B'],
      staffId: 1234,
      token: 'web-token',
      userId: '1234',
      displayName: 'J Bloggs',
      activeCaseLoad: {
        caseLoadId: 'RSI',
      },
      isActivitiesRolledOut: false,
      isAppointmentsRolledOut: true,
    }

    expect(testReq.session.user).toEqual(expectedUserDetails)

    expect(testRes.locals.user).toEqual(expectedUserDetails)

    expect(activitiesServiceMock.getPrisonRolloutPlan).not.toHaveBeenCalled()

    expect(response.status).toBe(200)
  })

  it('errors because auth source is not nomis', async () => {
    app.use((req: Request, res: Response, next: NextFunction) => {
      res.locals = {
        user: {
          authSource: 'something-else',
        },
      }
      res.render = jest.fn()
      next()
    })

    app.use(setUpCurrentUser(activitiesServiceMock))

    app.get('/path', (req, res) => {
      res.sendStatus(200)
    })

    // Add error handler to catch the 403 error
    app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      res.status(403).send()
    })

    const response = await request(app).get(`/path`)

    expect(activitiesServiceMock.getPrisonRolloutPlan).not.toHaveBeenCalled()

    expect(response.status).toBe(403)
  })
})
