import { plainToInstance } from 'class-transformer'
import { validate, ValidationError } from 'class-validator'
import { RequestHandler } from 'express'

export type FieldValidationError = {
  field: string
  message: string
}

function validationMiddleware(type: new () => object): RequestHandler {
  return async (req, res, next) => {
    if (!type) {
      return next()
    }

    // Build an object which is used by validators to check things against
    const requestObject = plainToInstance(type, {
      ...req.body,
      pathParams: req.params,
      queryParams: req.query,
      file: req.file,
      createJourney: req.session.createJourney,
      allocateJourney: req.session.allocateJourney,
      suspendJourney: req.session.suspendJourney,
      waitListApplicationJourney: req.session.waitListApplicationJourney,
      appointmentJourney: req.session.appointmentJourney,
      bookAVideoLinkJourney: req.session.bookAVideoLinkJourney,
      recordAttendanceJourney: req.session.recordAttendanceJourney,
    })

    const errors: ValidationError[] = await validate(requestObject, {
      stopAtFirstError: true,
      forbidUnknownValues: false,
    })

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
        const property = `${parent ? `${parent}-` : ''}${error.property}`

        return error.children.length > 0
          ? flattenErrors(error.children, property)
          : buildError(error, error.constraints, parent)
      })
    }

    req.flash('validationErrors', JSON.stringify(flattenErrors(errors)))
    req.flash('formResponses', JSON.stringify(req.body))

    return res.redirect('back')
  }
}

export default validationMiddleware
