import { Router } from 'express'

export default function setUpValidationExtensions(): Router {
  const router = Router({ mergeParams: true })

  router.use((req, res, next) => {
    const validationErrors: { field: string; message: string }[] = []
    res.addValidationError = (field: string, message: string): void => {
      validationErrors.push({ field, message })
    }

    res.validationFailed = (field?: string, message?: string): void => {
      if (message) {
        res.addValidationError(field, message)
      }

      req.flash('validationErrors', JSON.stringify(validationErrors))
      req.flash('formResponses', JSON.stringify(req.body))
      res.redirect(req.get('Referrer') || '/')
    }

    next()
  })

  return router
}
