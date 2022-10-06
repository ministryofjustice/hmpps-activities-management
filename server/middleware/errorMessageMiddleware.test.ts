import { Request, Response } from 'express'
import { when } from 'jest-when'
import checkForErrorMessages from './errorMessageMiddleware'

const flashMock = jest.fn()
const next = jest.fn()

const req = { flash: flashMock } as unknown as Request
const res = { locals: {} } as unknown as Response

const middleware = checkForErrorMessages()

beforeEach(() => {
  req.method = 'GET'
  res.locals = {}

  flashMock.mockReturnValue([])
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('errorMessageMiddleware', () => {
  it('should call next if no errors', async () => {
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

  it('should set validation errors if they exist', async () => {
    when(flashMock)
      .calledWith(expect.stringMatching('validationErrors'))
      .mockReturnValue([JSON.stringify({ val: 'error' })])

    middleware(req, res, next)
    expect(res.locals).toMatchObject({ validationErrors: { val: 'error' } })
    expect(next).toBeCalledTimes(1)
  })

  it('should set formResponses if they exist', async () => {
    when(flashMock)
      .calledWith(expect.stringMatching('formResponses'))
      .mockReturnValue([JSON.stringify({ form: 'response' })])

    middleware(req, res, next)
    expect(res.locals).toMatchObject({ formResponses: { form: 'response' } })
    expect(next).toBeCalledTimes(1)
  })
})
