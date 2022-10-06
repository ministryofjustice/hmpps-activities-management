import { RequestHandler } from 'express'

export default function checkForErrorMessages(): RequestHandler {
  return (req, res, next) => {
    if (req.method === 'GET') {
      const validationErrors = req.flash('validationErrors')[0]
      const formResponses = req.flash('formResponses')[0]

      if (validationErrors) {
        res.locals.validationErrors = JSON.parse(validationErrors)
      }

      if (formResponses) {
        res.locals.formResponses = JSON.parse(formResponses)
      }
    }
    next()
  }
}
