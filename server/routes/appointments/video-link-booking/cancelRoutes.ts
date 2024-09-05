import { RequestHandler, Router } from 'express'
import createHttpError from 'http-errors'
import { parseISO } from 'date-fns'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import type { Services } from '../../../services'
import validationMiddleware from '../../../middleware/validationMiddleware'
import ConfirmCancelRoutes from './handlers/confirmCancel'
import CancelConfirmedRoutes from './handlers/cancelConfirmed'

export default function CancelRoutes({ bookAVideoLinkService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  // Book a video link journey is required in session for the following routes
  router.use((req, res, next) => {
    if (!req.session.bookAVideoLinkJourney) return res.redirect('/appointments')
    return next()
  })

  router.use((req, res, next) => {
    const { date, preHearingStartTime, startTime, bookingStatus } = req.session.bookAVideoLinkJourney
    if (
      !bookAVideoLinkService.bookingIsAmendable(
        parseISO(date),
        parseISO(preHearingStartTime || startTime),
        bookingStatus,
      )
    ) {
      return next(createHttpError.NotFound())
    }

    return next()
  })

  const confirmCancel = new ConfirmCancelRoutes(bookAVideoLinkService)
  const cancelConfirmed = new CancelConfirmedRoutes()

  get('/confirm', confirmCancel.GET)
  post('/confirm', confirmCancel.POST)
  get('/confirmation', cancelConfirmed.GET)

  return router
}
