import { Request, Response } from 'express'
import { when } from 'jest-when'
import successMessageMiddleware from './successMessageMiddleware'

const flashMock = jest.fn()
const next = jest.fn()

const req = { flash: flashMock } as unknown as Request
const res = { locals: {} } as unknown as Response

const middleware = successMessageMiddleware()

beforeEach(() => {
  req.method = 'GET'
  res.locals = {}

  flashMock.mockReturnValue([])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('successMessageMiddleware', () => {
  it('should call next', async () => {
    middleware(req, res, next)
    expect(res.locals).toEqual({})
    expect(next).toBeCalledTimes(1)
  })

  it('should not read from flash if request method is not GET', async () => {
    req.method = 'POST'

    middleware(req, res, next)
    expect(res.locals).toEqual({})
    expect(flashMock).not.toHaveBeenCalled()
    expect(next).toBeCalledTimes(1)
  })

  it('should set success message if it exists', async () => {
    when(flashMock)
      .calledWith(expect.stringMatching('successMessage'))
      .mockReturnValue([JSON.stringify({ title: 'Success', message: 'Success message' })])

    middleware(req, res, next)
    expect(res.locals).toMatchObject({ successMessage: { title: 'Success', message: 'Success message' } })
    expect(next).toBeCalledTimes(1)
  })
})
