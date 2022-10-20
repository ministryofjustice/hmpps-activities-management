import { Request, Response } from 'express'
import { Session } from 'express-session'
import populateCurrentUser from './populateCurrentUser'
import UserService from '../services/userService'
import ActivitiesService from '../services/activitiesService'

jest.mock('../services/userService')

let res = {} as Response
let req = {} as Request
const next = jest.fn()

const userServiceMock = new UserService(null, null) as jest.Mocked<UserService>
const activitiesServiceMock = new ActivitiesService(null, null) as jest.Mocked<ActivitiesService>

const middleware = populateCurrentUser(userServiceMock, activitiesServiceMock)

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
  it('should add current user to res locals if it already exists in session', async () => {
    req.session = {
      user: {
        displayName: 'Joe Bloggs',
      },
    } as unknown as Session

    await middleware(req, res, next)

    expect(res.locals.user).toEqual({
      displayName: 'Joe Bloggs',
    })
    expect(next).toBeCalled()
  })

  it('should catch error from user service and persist it to next', async () => {
    userServiceMock.getUser.mockRejectedValue(new Error('Some error'))

    await middleware(req, res, next)

    expect(next).toBeCalledWith(new Error('Some error'))
  })
})
