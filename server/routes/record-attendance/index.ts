import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import SelectPeriodRoutes, { TimePeriod } from './handlers/selectPeriod'
import validationMiddleware from '../../middleware/validationMiddleware'
import ActivitiesRoutes from './handlers/activities'
import { Services } from '../../services'
import AttendanceListRoutes, { AttendanceList } from './handlers/attendanceList'
import CancelSessionRoutes from './handlers/cancelSession'

export default function Index({ activitiesService, prisonService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const selectPeriodHandler = new SelectPeriodRoutes()
  const activitiesHandler = new ActivitiesRoutes(activitiesService)
  const attendanceListHandler = new AttendanceListRoutes(activitiesService, prisonService)
  const cancelSessionRoutes = new CancelSessionRoutes()

  get('/select-period', selectPeriodHandler.GET)
  post('/select-period', selectPeriodHandler.POST, TimePeriod)
  get('/activities', activitiesHandler.GET)
  get('/activities/:id/attendance-list', attendanceListHandler.GET)
  post('/activities/:id/attended', attendanceListHandler.ATTENDED, AttendanceList)
  post('/activities/:id/not-attended', attendanceListHandler.NOT_ATTENDED, AttendanceList)
  get('/activities/:id/cancel', cancelSessionRoutes.GET)

  return router
}
