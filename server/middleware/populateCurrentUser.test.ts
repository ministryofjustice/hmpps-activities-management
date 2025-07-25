import { Request, Response } from 'express'
import { when } from 'jest-when'
import createHttpError from 'http-errors'
import populateCurrentUser from './populateCurrentUser'
import UserService from '../services/userService'
import { ServiceUser } from '../@types/express'

jest.mock('../services/userService')

let res = {} as Response
let req = {} as Request
const next = jest.fn()

const userServiceMock = new UserService(null, null, null) as jest.Mocked<UserService>

const middleware = populateCurrentUser(userServiceMock)

beforeEach(() => {
  jest.resetAllMocks()

  res = {
    locals: {},
  } as unknown as Response

  req = { session: {} } as Request
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('populateCurrentUser', () => {
  it('should add current user to res locals', async () => {
    when(userServiceMock.getUser).mockResolvedValue({ displayName: 'Joe Bloggs', authSource: 'nomis' } as ServiceUser)

    await middleware(req, res, next)

    expect(res.locals.user).toEqual({
      displayName: 'Joe Bloggs',
      authSource: 'nomis',
    })
    expect(next).toHaveBeenCalled()
  })

  it('should throw 403 http response if user is not a prison user', async () => {
    when(userServiceMock.getUser).mockResolvedValue({ authSource: 'auth' } as ServiceUser)

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledWith(createHttpError.Forbidden())
  })

  it('should catch error from user service and persist it to next', async () => {
    when(userServiceMock.getUser).mockRejectedValue(new Error('Some error'))

    await middleware(req, res, next)

    expect(next).toHaveBeenCalledWith(new Error('Some error'))
  })
})
