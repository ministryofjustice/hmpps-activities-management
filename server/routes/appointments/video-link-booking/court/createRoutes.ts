import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../../middleware/asyncMiddleware'
import type { Services } from '../../../../services'
import validationMiddleware from '../../../../middleware/validationMiddleware'
import SelectPrisonerRoutes, { Prisoner } from './handlers/selectPrisoner'
import HearingDetailsRoutes, { HearingDetails } from './handlers/hearingDetails'
import LocationRoutes, { Location } from './handlers/location'
import DateAndTimeRoutes, { DateAndTime } from './handlers/dateAndTime'
import ExtraInformationRoutes, { ExtraInformation } from './handlers/extraInformation'
import CheckBookingRoutes from './handlers/checkBooking'
import ConfirmationRoutes from './handlers/confirmation'
import ScheduleRoutes from './handlers/schedule'
import CourtHearingLinkRoutes, { CourtHearingLink } from './handlers/courtHearingLink'

export default function CreateRoutes({
  bookAVideoLinkService,
  prisonService,
  activitiesService,
  courtBookingService,
}: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const selectPrisoner = new SelectPrisonerRoutes()
  const hearingDetails = new HearingDetailsRoutes(bookAVideoLinkService, courtBookingService)
  const location = new LocationRoutes(bookAVideoLinkService)
  const dateAndTime = new DateAndTimeRoutes(bookAVideoLinkService)
  const schedule = new ScheduleRoutes(activitiesService, prisonService, bookAVideoLinkService, courtBookingService)
  const courtHearingLink = new CourtHearingLinkRoutes(courtBookingService)
  const extraInformation = new ExtraInformationRoutes(courtBookingService)
  const checkBooking = new CheckBookingRoutes(bookAVideoLinkService, courtBookingService)
  const confirmation = new ConfirmationRoutes(bookAVideoLinkService, prisonService)

  // Book a video link journey is required in session for the following routes
  router.use((req, res, next) => {
    if (!req.session.bookACourtHearingJourney) return res.redirect('/appointments')
    return next()
  })

  get('/select-prisoner', selectPrisoner.GET)
  post('/select-prisoner', selectPrisoner.POST, Prisoner)
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
  get('/check-answers', checkBooking.GET)
  post('/check-answers', checkBooking.POST)
  get('/confirmation/:vlbId', confirmation.GET)

  return router
}
