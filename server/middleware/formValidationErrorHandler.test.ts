import type { Request, Response } from 'express'

import formValidationErrorHandler, { FormValidationError } from './formValidationErrorHandler'

describe('Form Validation Handler', () => {
  let req: Request
  let res: Response

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

  it('should set validationErrors and formResponses if validation error is thrown', () => {
    req.body = {
      inputField: 'input value',
      name: 'John Smith',
    }

    const error = new FormValidationError('inputField', 'Input error message')
    formValidationErrorHandler(error, req, res, jest.fn)

    expect(res.validationFailed).toHaveBeenCalledWith('inputField', 'Input error message')
  })

  it("shouldn't set validationErrors and formResponses if another error is throw", () => {
    req.body = {
      inputField: 'input value',
      name: 'John Smith',
    }

    const error = new Error('Some other error')
    formValidationErrorHandler(error, req, res, jest.fn)

    expect(res.validationFailed).toHaveBeenCalledTimes(0)
  })
})
