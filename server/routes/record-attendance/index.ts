import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import SelectPeriodRoutes, { TimePeriod } from './handlers/selectPeriod'
import validationMiddleware from '../../middleware/validationMiddleware'
import ActivitiesRoutes from './handlers/activities'
import { Services } from '../../services'
import AttendanceListRoutes, { AttendanceList } from './handlers/attendanceList'
import NotAttendedReasonRoutes, { NotAttendedReason } from './handlers/notAttendedReason'
import CancelSessionReasonRoutes, { CancelReasonForm } from './handlers/cancel-session/reason'
import CancelSessionConfirmationRoutes, { CancelConfirmForm } from './handlers/cancel-session/confirmation'

export default function Index({ activitiesService, prisonService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const selectPeriodHandler = new SelectPeriodRoutes()
  const activitiesHandler = new ActivitiesRoutes(activitiesService)
  const attendanceListHandler = new AttendanceListRoutes(activitiesService, prisonService)
  const notAttendedReasonHandler = new NotAttendedReasonRoutes(activitiesService)
  const cancelSessionReasonRoutes = new CancelSessionReasonRoutes()
  const cancelSessionConfirmationRoutes = new CancelSessionConfirmationRoutes(activitiesService)

  get('/select-period', selectPeriodHandler.GET)
  post('/select-period', selectPeriodHandler.POST, TimePeriod)
  get('/activities', activitiesHandler.GET)
  get('/activities/:id/attendance-list', attendanceListHandler.GET)
  post('/activities/:id/attended', attendanceListHandler.ATTENDED, AttendanceList)
  post('/activities/:id/not-attended', attendanceListHandler.NOT_ATTENDED, AttendanceList)
  get('/activities/:id/not-attended-reason', notAttendedReasonHandler.GET)
  post('/activities/:id/not-attended-reason', notAttendedReasonHandler.POST, NotAttendedReason)
  get('/activities/:id/cancel', cancelSessionReasonRoutes.GET)
  post('/activities/:id/cancel', cancelSessionReasonRoutes.POST, CancelReasonForm)
  get('/activities/:id/cancel/confirm', cancelSessionConfirmationRoutes.GET)
  post('/activities/:id/cancel/confirm', cancelSessionConfirmationRoutes.POST, CancelConfirmForm)

  return router
}
