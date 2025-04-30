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
import CancelMultipleSessionsReasonRoutes, {
  CancelReasonMultipleForm,
} from './handlers/cancel-multiple-sessions/reason'
import CancelMultipleSessionsPayRoutes, { SessionPayMultipleForm } from './handlers/cancel-multiple-sessions/payment'
import CancelMultipleSessionsCheckAnswersRoutes from './handlers/cancel-multiple-sessions/checkAnswers'
import UncancelMultipleSessionsConfirmRoutes, {
  UncancelMultipleConfirmForm,
} from './handlers/uncancel-multiple-sessions/confirmation'
import UncancelMultipleSessionsRoutes from './handlers/uncancel-multiple-sessions/activitiesList'
import CancelMultipleSessionsViewEditDetailsRoutes from './handlers/cancel-multiple-sessions/viewOrEditDetails'
import UpdateCancelledSessionPayRoutes, { SessionPayForm } from './handlers/cancel-session/updatePayment'

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
  const updateCancelledSessionPayRoutes = new UpdateCancelledSessionPayRoutes(activitiesService)
  const cancelSessionConfirmationRoutes = new CancelSessionConfirmationRoutes(activitiesService)
  const uncancelSessionConfirmationRoutes = new UncancelSessionConfirmationRoutes(activitiesService)
  const attendanceDetailsHandler = new AttendanceDetailsRoutes(activitiesService, prisonService, userService)
  const editAttendanceHandler = new EditAttendanceRoutes(activitiesService, prisonService)
  const removePayHandler = new RemovePayRoutes(activitiesService, prisonService)
  const resetAttendanceRoutes = new ResetAttendanceRoutes(activitiesService, prisonService)
  const cancelMultipleSessionsReasonRoutes = new CancelMultipleSessionsReasonRoutes(activitiesService)
  const cancelMultipleSessionsPayRoutes = new CancelMultipleSessionsPayRoutes()
  const cancelMultipleSessionsCheckAnswersRoutes = new CancelMultipleSessionsCheckAnswersRoutes(activitiesService)
  const uncancelMultipleSessionsRoutes = new UncancelMultipleSessionsRoutes(activitiesService, prisonService)
  const uncancelMultipleSessionsConfirmRoutes = new UncancelMultipleSessionsConfirmRoutes(activitiesService)
  const cancelMultipleSessionsViewEditDetailsRoutes = new CancelMultipleSessionsViewEditDetailsRoutes(
    activitiesService,
    userService,
  )

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
  get('/:journeyId/activities/:id/cancel/payment', updateCancelledSessionPayRoutes.GET, true)
  post('/:journeyId/activities/:id/cancel/payment', updateCancelledSessionPayRoutes.POST, SessionPayForm)
  get('/:journeyId/activities/:id/cancel/confirm', cancelSessionConfirmationRoutes.GET, true)
  post('/:journeyId/activities/:id/cancel/confirm', cancelSessionConfirmationRoutes.POST, CancelConfirmForm)
  get('/:journeyId/activities/:id/uncancel', uncancelSessionConfirmationRoutes.GET, true)
  post('/:journeyId/activities/:id/uncancel', uncancelSessionConfirmationRoutes.POST, UncancelConfirmForm)
  get('/:journeyId/activities/:id/attendance-details/:attendanceId', attendanceDetailsHandler.GET)
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

  post('/:journeyId/activities/cancel-multiple', activitiesHandler.POST_CANCELLATIONS)
  get('/:journeyId/activities/cancel-multiple/cancel-reason', cancelMultipleSessionsReasonRoutes.GET, true)
  post(
    '/:journeyId/activities/cancel-multiple/cancel-reason',
    cancelMultipleSessionsReasonRoutes.POST,
    CancelReasonMultipleForm,
  )
  get('/:journeyId/activities/cancel-multiple/payment', cancelMultipleSessionsPayRoutes.GET, true)
  post('/:journeyId/activities/cancel-multiple/payment', cancelMultipleSessionsPayRoutes.POST, SessionPayMultipleForm)
  get('/:journeyId/activities/cancel-multiple/check-answers', cancelMultipleSessionsCheckAnswersRoutes.GET, true)
  post('/:journeyId/activities/cancel-multiple/check-answers', cancelMultipleSessionsCheckAnswersRoutes.POST)

  get('/:journeyId/activities/uncancel-multiple', uncancelMultipleSessionsRoutes.GET, true)
  post('/:journeyId/activities/uncancel-multiple', uncancelMultipleSessionsRoutes.POST)
  post('/:journeyId/activities/uncancel-multiple/next', uncancelMultipleSessionsRoutes.POST_UNCANCEL)
  get('/:journeyId/activities/uncancel-multiple/confirm', uncancelMultipleSessionsConfirmRoutes.GET, true)
  post(
    '/:journeyId/activities/uncancel-multiple/confirm',
    uncancelMultipleSessionsConfirmRoutes.POST,
    UncancelMultipleConfirmForm,
  )
  
  get(
    '/:journeyId/activities/cancel-multiple/view-edit-details/:id',
    cancelMultipleSessionsViewEditDetailsRoutes.GET,
    true,
  )

  return router
}
