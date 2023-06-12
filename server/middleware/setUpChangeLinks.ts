import { Router } from 'express'

export default function setUpChangeLinks(): Router {
  const router = Router({ mergeParams: true })

  router.use((req, res, next) => {
    res.redirectOrReturn = (path: string): void => {
      if (req.query.preserveHistory) {
        req.session.returnTo ??= 'check-answers'
      }
      const { returnTo } = req.session
      req.session.returnTo = null
      res.redirect(returnTo || path)
    }

    res.redirectOrReturnWithSuccess = (path: string, successHeading: string, message?: string): void => {
      if (req.query.preserveHistory) {
        req.session.returnTo ??= 'check-answers'
      }
      const { returnTo } = req.session
      req.session.returnTo = null
      res.redirectWithSuccess(returnTo || path, successHeading, message)
    }

    next()
  })

  return router
}
