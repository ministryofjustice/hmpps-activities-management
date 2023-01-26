import { plainToInstance } from 'class-transformer'
import { validate, ValidationError } from 'class-validator'
import { RequestHandler } from 'express'

export type FieldValidationError = {
  field: string
  message: string
}

function validationMiddleware(type: new () => object): RequestHandler {
  return async (req, res, next) => {
    // Build an object which is used by validators to check things against
    const requestObject = plainToInstance(type, { ...req.body, createJourney: req.session.createJourney })

    const errors: ValidationError[] = await validate(requestObject)

    if (errors.length === 0) {
      req.body = requestObject
      return next()
    }

    const buildError = (
      error: ValidationError,
      constraints: {
        [type: string]: string
      },
      parent?: string,
    ): FieldValidationError => ({
      field: `${parent ? `${parent}-` : ''}${error.property}`,
      message: Object.values(constraints)[Object.values(constraints).length - 1],
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flattenErrors: any = (errorList: ValidationError[], parent?: string) => {
      // Flat pack a list of errors with child errors into a 1-dimensional list of errors.
      return errorList.flatMap(error => {
        return error.children.length > 0
          ? flattenErrors(error.children, error.property)
          : buildError(error, error.constraints, parent)
      })
    }

    req.flash('validationErrors', JSON.stringify(flattenErrors(errors)))
    req.flash('formResponses', JSON.stringify(req.body))

    return res.redirect('back')
  }
}

export default validationMiddleware
