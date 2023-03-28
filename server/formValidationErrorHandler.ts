import type { ErrorRequestHandler } from 'express'

/**
 * FormValidationError is a simple way to throw a form validation error from anywhere in the application
 * Example usage: throw new FormValidationError('errorField', 'validation message')
 */
export class FormValidationError extends Error {
  field: string

  constructor(field: string, message: string) {
    super(message)
    this.field = field
  }
}

const formValidationErrorHandler: ErrorRequestHandler = (err: Error, req, res, next): void => {
  if (!(err instanceof FormValidationError)) return next(err)

  req.flash('validationErrors', JSON.stringify([{ field: err.field, message: err.message }]))
  req.flash('formResponses', JSON.stringify(req.body))
  return res.redirect('back')
}

export default formValidationErrorHandler
