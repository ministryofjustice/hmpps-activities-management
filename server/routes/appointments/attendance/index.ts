import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import SelectDateRoutes, { SelectDate } from './handlers/selectDate'
import SummariesRoutes from './handlers/summaries'
import AttendeesRoutes from './handlers/attendees'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import config from '../../../config'
import insertJourneyIdentifier from '../../../middleware/insertJourneyIdentifier'
import AttendanceDetailsRoutes from './handlers/attendanceDetails'
import EditAttendanceRoutes, { EditAttendance } from './handlers/editAttendance'

export default function Index({ activitiesService, prisonService, userService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))
  const getForJourney = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(
      path,
      emptyJourneyHandler('recordAppointmentAttendanceJourney', stepRequiresSession),
      asyncMiddleware(handler),
    )

  const selectDateRoutes = new SelectDateRoutes()
  const summariesRoutes = new SummariesRoutes(activitiesService, prisonService)
  const attendeesRoutes = new AttendeesRoutes(activitiesService, userService)
  const attendanceDetailsRoutes = new AttendanceDetailsRoutes(activitiesService, userService)
  const editAttendanceRoutes = new EditAttendanceRoutes(activitiesService)

  if (config.appointmentMultipleAttendanceToggleEnabled) {
    router.use(insertJourneyIdentifier())

    get('/:journeyId/select-date', selectDateRoutes.GET)
    post('/:journeyId/select-date', selectDateRoutes.POST, SelectDate)
    get('/:journeyId/summaries', summariesRoutes.GET)
    post('/:journeyId/summaries/select-appointments', summariesRoutes.SELECT_APPOINTMENTS)
    post('/:journeyId/summaries', summariesRoutes.POST)
    getForJourney('/:journeyId/attendees', attendeesRoutes.GET_MULTIPLE, true)
    get('/:journeyId/:appointmentId/attendees', attendeesRoutes.GET_SINGLE)
    post('/:journeyId/attend', attendeesRoutes.ATTEND)
    post('/:journeyId/non-attend', attendeesRoutes.NON_ATTEND)
    getForJourney('/:journeyId/attendees/:appointmentId/:prisonerNumber', attendanceDetailsRoutes.GET, true)
    getForJourney(
      '/:journeyId/attendees/:appointmentId/:prisonerNumber/edit-attendance',
      editAttendanceRoutes.GET,
      true,
    )
    post(
      '/:journeyId/attendees/:appointmentId/:prisonerNumber/edit-attendance',
      editAttendanceRoutes.POST,
      EditAttendance,
    )
  } else {
    get('/select-date', selectDateRoutes.GET)
    post('/select-date', selectDateRoutes.POST, SelectDate)
    get('/summaries', summariesRoutes.GET)
  }

  return router
}
