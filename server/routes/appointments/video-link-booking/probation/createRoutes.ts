import { RequestHandler, Router } from 'express'
import validationMiddleware from '../../../../middleware/validationMiddleware'
import SelectPrisonerRoutes, { Prisoner } from './handlers/selectPrisoner'
import LocationRoutes, { Location } from './handlers/location'
import { Services } from '../../../../services'
import MeetingDetailsRoutes, { MeetingDetails } from './handlers/meetingDetails'
import DateAndTimeRoutes, { DateAndTime } from './handlers/dateAndTime'
import ExtraInformationRoutes, { ExtraInformation } from './handlers/extraInformation'
import ScheduleRoutes from './handlers/schedule'
import CheckBookingRoutes from './handlers/checkBooking'
import ConfirmationRoutes from './handlers/confirmation'

export default function CreateRoutes({
  bookAVideoLinkService,
  probationBookingService,
  activitiesService,
  prisonService,
}: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, handler)
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), handler)

  const selectPrisoner = new SelectPrisonerRoutes()
  const location = new LocationRoutes(bookAVideoLinkService)
  const meetingDetails = new MeetingDetailsRoutes(bookAVideoLinkService, probationBookingService)
  const dateAndTime = new DateAndTimeRoutes(bookAVideoLinkService)
  const schedule = new ScheduleRoutes(activitiesService, prisonService, bookAVideoLinkService, probationBookingService)
  const extraInformation = new ExtraInformationRoutes(probationBookingService)
  const checkBooking = new CheckBookingRoutes(bookAVideoLinkService, probationBookingService)
  const confirmation = new ConfirmationRoutes(bookAVideoLinkService, prisonService)

  // Book a video link journey is required in session for the following routes
  router.use((req, res, next) => {
    if (!req.session.bookAProbationMeetingJourney) return res.redirect('/appointments')
    return next()
  })

  get('/select-prisoner', selectPrisoner.GET)
  post('/select-prisoner', selectPrisoner.POST, Prisoner)
  get('/location', location.GET)
  post('/location', location.POST, Location)
  get('/meeting-details', meetingDetails.GET)
  post('/meeting-details', meetingDetails.POST, MeetingDetails)
  get('/date-and-time', dateAndTime.GET)
  post('/date-and-time', dateAndTime.POST, DateAndTime)
  get('/schedule', schedule.GET)
  post('/schedule', schedule.POST)
  get('/extra-information', extraInformation.GET)
  post('/extra-information', extraInformation.POST, ExtraInformation)
  get('/check-answers', checkBooking.GET)
  post('/check-answers', checkBooking.POST)
  get('/confirmation/:vlbId', confirmation.GET)

  return router
}
