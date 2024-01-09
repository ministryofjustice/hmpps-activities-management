import { Request, Response } from 'express'
import createHttpError from 'http-errors'
import { authRole } from './routeAuthMiddleware'
import { ServiceUser } from '../@types/express'

let res = {} as Response
let req = {} as Request
const next = jest.fn()

beforeEach(() => {
  jest.resetAllMocks()

  res = {
    locals: {
      user: {},
    },
  } as unknown as Response

  req = { session: {} } as Request
})

describe('authRoute', () => {
  it('should authorize user and call next if they have required role for route', () => {
    req.path = '/activities/create/activity'
    res.locals.user = {
      roles: ['ROLE_ACTIVITY_HUB'],
    } as ServiceUser

    authRole(['ROLE_ACTIVITY_HUB'])(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
  })

  it("should deny user if they don't have required role for route", () => {
    req.path = '/activities/create/activity'
    res.locals.user = {
      roles: ['ANOTHER_ROLE'],
    } as ServiceUser

    authRole(['ROLE_ACTIVITY_HUB'])(req, res, next)

    expect(next).toHaveBeenCalledWith(createHttpError.Forbidden())
  })
})
