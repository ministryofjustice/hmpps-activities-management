import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import validationMiddleware from '../../../middleware/validationMiddleware'
import SelectDateRoutes, { SelectDate } from './handlers/selectDate'
import SummariesRoutes from './handlers/summaries'
import AttendeesRoutes from './handlers/attendees'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import insertJourneyIdentifier from '../../../middleware/insertJourneyIdentifier'
import AttendanceDetailsRoutes from './handlers/attendanceDetails'
import EditAttendanceRoutes, { EditAttendance } from './handlers/editAttendance'

export default function Index({ activitiesService, prisonService, userService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, handler)
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), handler)
  const getForJourney = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('recordAppointmentAttendanceJourney', stepRequiresSession), handler)

  const selectDateRoutes = new SelectDateRoutes()
  const summariesRoutes = new SummariesRoutes(activitiesService, prisonService)
  const attendeesRoutes = new AttendeesRoutes(activitiesService, prisonService)
  const attendanceDetailsRoutes = new AttendanceDetailsRoutes(activitiesService, userService)
  const editAttendanceRoutes = new EditAttendanceRoutes(activitiesService)

  router.use(insertJourneyIdentifier())

  get('/:journeyId/select-date', selectDateRoutes.GET)
  post('/:journeyId/select-date', selectDateRoutes.POST, SelectDate)
  get('/:journeyId/summaries', summariesRoutes.GET)
  post('/:journeyId/summaries/select-appointments', summariesRoutes.SELECT_APPOINTMENTS)
  post('/:journeyId/summaries', summariesRoutes.POST)
  getForJourney('/:journeyId/attendees', attendeesRoutes.GET_MULTIPLE, true)
  get('/:journeyId/:appointmentId/attendees', attendeesRoutes.GET_SINGLE)
  post('/:journeyId/attendees', attendeesRoutes.POST)
  post('/:journeyId/attendees/attend', attendeesRoutes.ATTEND)
  post('/:journeyId/attendees/non-attend', attendeesRoutes.NON_ATTEND)
  getForJourney('/:journeyId/attendees/:appointmentId/:prisonerNumber', attendanceDetailsRoutes.GET, true)
  getForJourney('/:journeyId/attendees/:appointmentId/:prisonerNumber/edit-attendance', editAttendanceRoutes.GET, true)
  post(
    '/:journeyId/attendees/:appointmentId/:prisonerNumber/edit-attendance',
    editAttendanceRoutes.POST,
    EditAttendance,
  )
  get('/:journeyId/:appointmentId/select-appointment', summariesRoutes.SELECT_APPOINTMENT)

  return router
}
