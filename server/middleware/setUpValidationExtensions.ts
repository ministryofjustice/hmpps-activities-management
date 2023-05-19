import { Router } from 'express'

export default function setUpValidationExtensions(): Router {
  const router = Router({ mergeParams: true })

  router.use((req, res, next) => {
    const validationErrors: { field: string; message: string }[] = []
    res.addValidationError = (field: string, message: string): void => {
      validationErrors.push({ field, message })
    }

    res.validationFailed = (field?: string, message?: string, redirect = true): void => {
      if (field && message) {
        res.addValidationError(field, message)
      }

      if (redirect) {
        // Set flash variables for next request and redirect back
        req.flash('validationErrors', JSON.stringify(validationErrors))
        req.flash('formResponses', JSON.stringify(req.body))
        res.redirect('back')
      } else {
        // If not redirecting, set errors for current request
        res.locals.validationErrors = validationErrors
        res.locals.formResponses = req.body
      }
    }

    next()
  })

  return router
}
