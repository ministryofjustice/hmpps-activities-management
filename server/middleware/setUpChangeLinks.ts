import { Router } from 'express'

export default function setUpChangeLinks(): Router {
  const router = Router({ mergeParams: true })

  router.use((req, res, next) => {
    if (req.query.fromReview) {
      req.session.returnTo = 'check-answers'
    }

    res.redirectOrReturn = (path: string): void => {
      const { returnTo } = req.session
      req.session.returnTo = null
      res.redirect(returnTo || path)
    }

    res.redirectOrReturnWithSuccess = (path: string, successHeading: string, message?: string): void => {
      const { returnTo } = req.session
      req.session.returnTo = null
      res.redirectWithSuccess(returnTo || path, successHeading, message)
    }

    next()
  })

  return router
}
