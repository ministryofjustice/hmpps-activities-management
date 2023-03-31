import { Router } from 'express'

export default function setUpValidationExtensions(): Router {
  const router = Router({ mergeParams: true })

  router.use((req, res, next) => {
    res.validationFailed = (field: string, message: string): void => {
      req.flash('validationErrors', JSON.stringify([{ field, message }]))
      req.flash('formResponses', JSON.stringify(req.body))
      res.redirect('back')
    }

    next()
  })

  return router
}
