import { Router } from 'express'

export default function setUpValidationExtensions(): Router {
  const router = Router({ mergeParams: true })

  router.use((req, res, next) => {
    const validationErrors: { field: string; message: string }[] = []
    res.addValidationError = (field: string, message: string): void => {
      validationErrors.push({ field, message })
    }

    res.validationFailed = (field?: string, message?: string): void => {
      if (field !== undefined && field !== null && message) {
        res.addValidationError(field, message)
      }

      req.flash('validationErrors', JSON.stringify(validationErrors))
      req.flash('formResponses', JSON.stringify(req.body))
      res.redirect('back')
    }

    next()
  })

  return router
}
