import { Router } from 'express'

export default function setUpSuccessMessages(): Router {
  const router = Router({ mergeParams: true })

  router.use((req, res, next) => {
    res.redirectWithSuccess = (path: string, successHeading: string, message?: string): void => {
      req.flash('successMessage', JSON.stringify({ heading: successHeading, message }))
      res.redirect(path)
    }

    next()
  })

  return router
}
