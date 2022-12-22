import { Router } from 'express'

export default function setUpChangeLinks(): Router {
  const router = Router({ mergeParams: true })

  router.use((req, res, next) => {
    res.redirectOrReturn = (path: string, returnTo = 'check-answers', flag = 'fromReview'): void => {
      if (req.query[flag]) {
        res.redirect(returnTo)
      } else {
        res.redirect(path)
      }
    }

    next()
  })

  return router
}
