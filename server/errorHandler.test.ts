import type { Request, Response } from 'express'

import { HTTPError } from 'superagent'
import createErrorHandler from './errorHandler'

describe('Error Handler', () => {
  let req: Request
  let res: Response
  let error: HTTPError

  beforeEach(() => {
    req = {
      flash: jest.fn(),
    } as unknown as Request

    res = {
      redirect: jest.fn(),
      render: jest.fn(),
      status: jest.fn(),
      locals: {
        user: {
          username: 'user',
        },
      },
      validationFailed: jest.fn(),
    } as unknown as Response
  })

  it('should log user out if error is 401', () => {
    const handler = createErrorHandler(false)

    error = {
      status: 401,
    } as HTTPError

    handler(error, req, res, jest.fn)

    expect(res.redirect).toHaveBeenCalledWith('/sign-out')
  })

  it('should display error if 403', () => {
    const handler = createErrorHandler(false)

    error = {
      status: 403,
      message: 'forbidden',
      stack: 'stacktrace',
    } as HTTPError

    handler(error, req, res, jest.fn)

    expect(res.render).toHaveBeenCalledWith('pages/error', {
      message: 'forbidden',
      status: 403,
      stack: 'stacktrace',
    })
  })

  it('should display not found error if 404', () => {
    const handler = createErrorHandler(false)

    error = {
      status: 404,
      message: 'not found',
    } as HTTPError

    handler(error, req, res, jest.fn)

    expect(res.render).toHaveBeenCalledWith('pages/404')
  })

  it('should add 400 messages to flash validation messages and redirect back', () => {
    const handler = createErrorHandler(false)

    error = {
      status: 400,
      text: JSON.stringify({
        developerMessage: 'User friendly message',
      }),
    } as HTTPError

    handler(error, req, res, jest.fn)

    expect(res.validationFailed).toHaveBeenCalledWith('', 'User friendly message')
  })

  it('should render error page with stacktrace if not in production', () => {
    const handler = createErrorHandler(false)

    error = {
      status: 500,
      message: 'internal server error',
      stack: 'stacktrace',
    } as HTTPError

    handler(error, req, res, jest.fn)

    expect(res.render).toHaveBeenCalledWith('pages/error', {
      message: 'internal server error',
      status: 500,
      stack: 'stacktrace',
    })
    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('should render error page with error message if in production', () => {
    const handler = createErrorHandler(true)

    error = {
      status: 500,
      message: 'internal server error',
      stack: 'stacktrace',
    } as HTTPError

    handler(error, req, res, jest.fn)

    expect(res.render).toHaveBeenCalledWith('pages/error', {
      message: 'Sorry, there is a problem with the service',
      status: 500,
      stack: null,
    })
    expect(res.status).toHaveBeenCalledWith(500)
  })

  it('should set status to 500 if status not supplied in error', () => {
    const handler = createErrorHandler(true)

    error = {
      message: 'error',
      stack: 'stacktrace',
    } as HTTPError

    handler(error, req, res, jest.fn)

    expect(res.render).toHaveBeenCalledWith('pages/error', {
      message: 'Sorry, there is a problem with the service',
      status: 500,
      stack: null,
    })
    expect(res.status).toHaveBeenCalledWith(500)
  })
})
