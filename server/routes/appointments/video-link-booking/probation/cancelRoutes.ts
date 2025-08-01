import { RequestHandler, Router } from 'express'
import createHttpError from 'http-errors'
import { parseISO } from 'date-fns'
import type { Services } from '../../../../services'
import validationMiddleware from '../../../../middleware/validationMiddleware'
import ConfirmCancelRoutes from './handlers/confirmCancel'
import CancelConfirmedRoutes from './handlers/cancelConfirmed'

export default function CancelRoutes({ bookAVideoLinkService, probationBookingService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, handler)
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), handler)

  const confirmCancel = new ConfirmCancelRoutes(probationBookingService)
  const cancelConfirmed = new CancelConfirmedRoutes(bookAVideoLinkService)

  // Book a probation meeting journey is required in session for the following routes
  router.use((req, res, next) => {
    if (!req.session.bookAProbationMeetingJourney) return res.redirect('/appointments')
    return next()
  })

  get('/confirmation', cancelConfirmed.GET)

  // Booking needs to be amendable for the following routes
  router.use((req, res, next) => {
    const { date, startTime, bookingStatus } = req.session.bookAProbationMeetingJourney
    if (!bookAVideoLinkService.bookingIsAmendable(parseISO(date), parseISO(startTime), bookingStatus)) {
      return next(createHttpError.NotFound())
    }

    return next()
  })

  get('/confirm', confirmCancel.GET)
  post('/confirm', confirmCancel.POST)

  return router
}
