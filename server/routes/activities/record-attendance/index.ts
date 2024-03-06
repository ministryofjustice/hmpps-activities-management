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

export default function Index({ activitiesService, prisonService, userService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const homeHandler = new HomeRoutes()
  const selectPeriodHandler = new SelectPeriodRoutes()
  const activitiesHandler = new ActivitiesRoutes(activitiesService)
  const attendanceListHandler = new AttendanceListRoutes(activitiesService, prisonService)
  const notAttendedReasonHandler = new NotAttendedReasonRoutes(activitiesService)
  const cancelSessionReasonRoutes = new CancelSessionReasonRoutes(activitiesService)
  const cancelSessionConfirmationRoutes = new CancelSessionConfirmationRoutes(activitiesService)
  const uncancelSessionConfirmationRoutes = new UncancelSessionConfirmationRoutes(activitiesService)
  const attendanceDetailsHandler = new AttendanceDetailsRoutes(activitiesService, prisonService, userService)
  const editAttendanceHandler = new EditAttendanceRoutes(activitiesService, prisonService)
  const removePayHandler = new RemovePayRoutes(activitiesService, prisonService)
  const resetAttendanceRoutes = new ResetAttendanceRoutes(activitiesService, prisonService)

  get('/', homeHandler.GET)
  get('/select-period', selectPeriodHandler.GET)
  post('/select-period', selectPeriodHandler.POST, TimePeriod)
  get('/activities', activitiesHandler.GET)
  post('/activities', activitiesHandler.POST)
  get('/activities/:id/attendance-list', attendanceListHandler.GET)
  post('/activities/:id/attended', attendanceListHandler.ATTENDED, AttendanceList)
  post('/activities/:id/not-attended', attendanceListHandler.NOT_ATTENDED, AttendanceList)
  get('/activities/:id/not-attended-reason', notAttendedReasonHandler.GET)
  post('/activities/:id/not-attended-reason', notAttendedReasonHandler.POST, NotAttendedForm)
  get('/activities/:id/cancel', cancelSessionReasonRoutes.GET)
  post('/activities/:id/cancel', cancelSessionReasonRoutes.POST, CancelReasonForm)
  get('/activities/:id/cancel/confirm', cancelSessionConfirmationRoutes.GET)
  post('/activities/:id/cancel/confirm', cancelSessionConfirmationRoutes.POST, CancelConfirmForm)
  get('/activities/:id/uncancel', uncancelSessionConfirmationRoutes.GET)
  post('/activities/:id/uncancel', uncancelSessionConfirmationRoutes.POST, UncancelConfirmForm)
  get('/activities/:id/attendance-details/:attendanceId', attendanceDetailsHandler.GET)
  post('/activities/:id/attendance-details/:attendanceId', attendanceDetailsHandler.POST)
  get('/activities/:id/attendance-details/:attendanceId/edit-attendance', editAttendanceHandler.GET)
  post('/activities/:id/attendance-details/:attendanceId/edit-attendance', editAttendanceHandler.POST, EditAttendance)
  get('/activities/:id/attendance-details/:attendanceId/remove-pay', removePayHandler.GET)
  post('/activities/:id/attendance-details/:attendanceId/remove-pay', removePayHandler.POST, RemovePay)
  get('/activities/:id/attendance-details/:attendanceId/reset-attendance', resetAttendanceRoutes.GET)
  post('/activities/:id/attendance-details/:attendanceId/reset-attendance', resetAttendanceRoutes.POST, ResetAttendance)

  return router
}
