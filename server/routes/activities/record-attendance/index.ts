import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import SelectPeriodRoutes, { TimePeriod } from './handlers/selectPeriod'
import validationMiddleware from '../../../middleware/validationMiddleware'
import ActivitiesRoutes from './handlers/activities'
import { Services } from '../../../services'
import AttendanceListRoutes, { AttendanceList } from './handlers/attendanceList'
import NotAttendedReasonRoutes, { NotAttendedForm } from './handlers/notAttendedReason'
import CancelSessionReasonRoutes, { CancelReasonForm } from './handlers/cancel-session/reason'
import CancelSessionConfirmationRoutes, { CancelConfirmForm } from './handlers/cancel-session/confirmation'
import UncancelSessionConfirmationRoutes, { UncancelConfirmForm } from './handlers/uncancel-session/confirmation'
import AttendanceDetailsRoutes from './handlers/attendanceDetails'
import EditAttendanceRoutes, { EditAttendance } from './handlers/editAttendance'
import RemovePayRoutes, { RemovePay } from './handlers/removePay'
import HomeRoutes from './handlers/home'
import ResetAttendanceRoutes, { ResetAttendance } from './handlers/resetAttendance'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import insertJourneyIdentifier from '../../../middleware/insertJourneyIdentifier'

export default function Index({ activitiesService, prisonService, userService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('recordAttendanceJourney', stepRequiresSession), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const homeHandler = new HomeRoutes()
  const selectPeriodHandler = new SelectPeriodRoutes()
  const activitiesHandler = new ActivitiesRoutes(activitiesService, prisonService)
  const attendanceListHandler = new AttendanceListRoutes(activitiesService, prisonService, userService)
  const notAttendedReasonHandler = new NotAttendedReasonRoutes(activitiesService)
  const cancelSessionReasonRoutes = new CancelSessionReasonRoutes(activitiesService)
  const cancelSessionConfirmationRoutes = new CancelSessionConfirmationRoutes(activitiesService)
  const uncancelSessionConfirmationRoutes = new UncancelSessionConfirmationRoutes(activitiesService)
  const attendanceDetailsHandler = new AttendanceDetailsRoutes(activitiesService, prisonService, userService)
  const editAttendanceHandler = new EditAttendanceRoutes(activitiesService, prisonService)
  const removePayHandler = new RemovePayRoutes(activitiesService, prisonService)
  const resetAttendanceRoutes = new ResetAttendanceRoutes(activitiesService, prisonService)

  get('/', homeHandler.GET)

  router.use(insertJourneyIdentifier())

  get('/:journeyId/select-period', selectPeriodHandler.GET)
  post('/:journeyId/select-period', selectPeriodHandler.POST, TimePeriod)

  get('/:journeyId/activities', activitiesHandler.GET)
  post('/:journeyId/activities', activitiesHandler.POST)

  post('/:journeyId/activities/attendance-list', activitiesHandler.POST_ATTENDANCES)
  get('/:journeyId/activities/:id/attendance-list', attendanceListHandler.GET)
  get('/:journeyId/activities/attendance-list', attendanceListHandler.GET_ATTENDANCES, true)

  post('/:journeyId/activities/attended', attendanceListHandler.ATTENDED_MULTIPLE, AttendanceList)
  post('/:journeyId/activities/:id/attended', attendanceListHandler.ATTENDED, AttendanceList)

  post('/:journeyId/activities/:id/not-attended', attendanceListHandler.NOT_ATTENDED, AttendanceList)
  post('/:journeyId/activities/not-attended', attendanceListHandler.NOT_ATTENDED, AttendanceList)

  get('/:journeyId/activities/not-attended-reason', notAttendedReasonHandler.GET, true)
  post('/:journeyId/activities/not-attended-reason', notAttendedReasonHandler.POST, NotAttendedForm)

  get('/:journeyId/activities/:id/cancel', cancelSessionReasonRoutes.GET, true)
  post('/:journeyId/activities/:id/cancel', cancelSessionReasonRoutes.POST, CancelReasonForm)
  get('/:journeyId/activities/:id/cancel/confirm', cancelSessionConfirmationRoutes.GET, true)
  post('/:journeyId/activities/:id/cancel/confirm', cancelSessionConfirmationRoutes.POST, CancelConfirmForm)
  get('/:journeyId/activities/:id/uncancel', uncancelSessionConfirmationRoutes.GET, true)
  post('/:journeyId/activities/:id/uncancel', uncancelSessionConfirmationRoutes.POST, UncancelConfirmForm)
  get('/:journeyId/activities/:id/attendance-details/:attendanceId', attendanceDetailsHandler.GET, true)
  post('/:journeyId/activities/:id/attendance-details/:attendanceId', attendanceDetailsHandler.POST)
  get('/:journeyId/activities/:id/attendance-details/:attendanceId/edit-attendance', editAttendanceHandler.GET, true)
  post(
    '/:journeyId/activities/:id/attendance-details/:attendanceId/edit-attendance',
    editAttendanceHandler.POST,
    EditAttendance,
  )
  get('/:journeyId/activities/:id/attendance-details/:attendanceId/remove-pay', removePayHandler.GET, true)
  post('/:journeyId/activities/:id/attendance-details/:attendanceId/remove-pay', removePayHandler.POST, RemovePay)
  get('/:journeyId/activities/:id/attendance-details/:attendanceId/reset-attendance', resetAttendanceRoutes.GET, true)
  post(
    '/:journeyId/activities/:id/attendance-details/:attendanceId/reset-attendance',
    resetAttendanceRoutes.POST,
    ResetAttendance,
  )

  return router
}
