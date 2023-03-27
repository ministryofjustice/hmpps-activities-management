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
    } as unknown as Response
  })

  it('should set validationErrors and formResponses if validation error is thrown', () => {
    req.body = {
      inputField: 'input value',
      name: 'John Smith',
    }

    const error = new FormValidationError('inputField', 'Input error message')
    formValidationErrorHandler(error, req, res, jest.fn)

    expect(req.flash).toHaveBeenCalledWith(
      'validationErrors',
      JSON.stringify([{ field: 'inputField', message: 'Input error message' }]),
    )
    expect(req.flash).toHaveBeenCalledWith('formResponses', JSON.stringify(req.body))
  })

  it("shouldn't set validationErrors and formResponses if another error is throw", () => {
    req.body = {
      inputField: 'input value',
      name: 'John Smith',
    }

    const error = new Error('Some other error')
    formValidationErrorHandler(error, req, res, jest.fn)

    expect(req.flash).toHaveBeenCalledTimes(0)
  })
})
