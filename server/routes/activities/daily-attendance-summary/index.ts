import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import SelectPeriodRoutes, { TimePeriod } from './handlers/selectPeriod'
import DailySummaryRoutes from './handlers/dailySummary'
import DailyAttendanceRoutes from './handlers/attendance'
import CancelledSessionsRoutes from './handlers/cancelledSessions'
import validationMiddleware from '../../../middleware/validationMiddleware'
import NotAttendedSelectDateRoutes, { NotAttendedDate } from './handlers/notAttendedSelectDate'
import { Services } from '../../../services'
import ApplyFiltersRoutes, { Filters } from './handlers/applyFilters'

export default function Index({ activitiesService, prisonService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const selectPeriodHandler = new SelectPeriodRoutes()
  const applyFiltersHandler = new ApplyFiltersRoutes()
  const dailySummaryHandler = new DailySummaryRoutes(activitiesService)
  const dailyAttendanceHandler = new DailyAttendanceRoutes(activitiesService, prisonService)
  const cancelledSessionsHandler = new CancelledSessionsRoutes(activitiesService)
  const notAttendedSelectDateHandler = new NotAttendedSelectDateRoutes()

  get('/select-period', selectPeriodHandler.GET)
  post('/select-period', selectPeriodHandler.POST, TimePeriod)
  get('/summary', dailySummaryHandler.GET)
  get('/attendance', dailyAttendanceHandler.GET)
  get('/cancelled-sessions', cancelledSessionsHandler.GET)
  get('/not-attended-select-date', notAttendedSelectDateHandler.GET)
  post('/not-attended-select-date', notAttendedSelectDateHandler.POST, NotAttendedDate)
  post('/update-filters', applyFiltersHandler.APPLY, Filters)

  return router
}
