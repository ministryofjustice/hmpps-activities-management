import { RequestHandler, Router } from 'express'
import createHttpError from 'http-errors'
import { parseISO } from 'date-fns'
import type { Services } from '../../../../services'
import validationMiddleware from '../../../../middleware/validationMiddleware'
import HearingDetailsRoutes, { HearingDetails } from './handlers/hearingDetails'
import LocationRoutes, { Location } from './handlers/location'
import DateAndTimeRoutes, { DateAndTime } from './handlers/dateAndTime'
import ExtraInformationRoutes, { ExtraInformation } from './handlers/extraInformation'
import ScheduleRoutes from './handlers/schedule'
import CourtHearingLinkRoutes, { CourtHearingLink } from './handlers/courtHearingLink'

export default function AmendRoutes({
  bookAVideoLinkService,
  prisonService,
  activitiesService,
  courtBookingService,
}: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, handler)
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), handler)

  const hearingDetails = new HearingDetailsRoutes(bookAVideoLinkService, courtBookingService)
  const location = new LocationRoutes(bookAVideoLinkService)
  const dateAndTime = new DateAndTimeRoutes(bookAVideoLinkService)
  const schedule = new ScheduleRoutes(activitiesService, prisonService, bookAVideoLinkService, courtBookingService)
  const courtHearingLink = new CourtHearingLinkRoutes(courtBookingService)
  const extraInformation = new ExtraInformationRoutes(courtBookingService)

  // Book a court hearing journey is required in session for the following routes
  router.use((req, res, next) => {
    if (!req.session.bookACourtHearingJourney) return res.redirect('/appointments')
    return next()
  })

  // Booking needs to be amendable for the following routes
  router.use((req, res, next) => {
    const { date, preHearingStartTime, startTime, bookingStatus } = req.session.bookACourtHearingJourney
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

  get('/hearing-details', hearingDetails.GET)
  post('/hearing-details', hearingDetails.POST, HearingDetails)
  get('/location', location.GET)
  post('/location', location.POST, Location)
  get('/date-and-time', dateAndTime.GET)
  post('/date-and-time', dateAndTime.POST, DateAndTime)
  get('/schedule', schedule.GET)
  post('/schedule', schedule.POST)
  get('/court-hearing-link', courtHearingLink.GET)
  post('/court-hearing-link', courtHearingLink.POST, CourtHearingLink)
  get('/extra-information', extraInformation.GET)
  post('/extra-information', extraInformation.POST, ExtraInformation)

  return router
}
