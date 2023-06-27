import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import SelectPeriodRoutes, { TimePeriod } from './handlers/selectPeriod'
import DailySummaryRoutes from './handlers/dailySummary'
import DailyAttendanceRoutes from './handlers/attendance'
import validationMiddleware from '../../../middleware/validationMiddleware'
import { Services } from '../../../services'
import CancelledSessionsRoutes from './handlers/cancelledSessions'

export default function Index({ activitiesService, prisonService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const selectPeriodHandler = new SelectPeriodRoutes()
  const dailySummaryHandler = new DailySummaryRoutes(activitiesService)
  const dailyAttendanceHandler = new DailyAttendanceRoutes(activitiesService, prisonService)
  const cancelledSessionsHandler = new CancelledSessionsRoutes(activitiesService)

  get('/select-period', selectPeriodHandler.GET)
  post('/select-period', selectPeriodHandler.POST, TimePeriod)
  get('/summary', dailySummaryHandler.GET)
  post('/summary', dailySummaryHandler.POST)
  get('/update-filters', dailySummaryHandler.FILTERS)
  get('/attendance', dailyAttendanceHandler.GET)
  post('/attendance', dailyAttendanceHandler.POST)
  get('/update-attendance-filters', dailyAttendanceHandler.FILTERS)
  get('/cancelled-sessions', cancelledSessionsHandler.GET)
  post('/cancelled-sessions', cancelledSessionsHandler.POST)

  return router
}
