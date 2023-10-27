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
import insertJourneyIdentifier from '../../../middleware/insertJourneyIdentifier'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import SuspendedPrisonersRoutes from './handlers/suspendedPrisoners'

export default function Index({ activitiesService, prisonService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('attendanceSummaryJourney', stepRequiresSession), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const selectPeriodHandler = new SelectPeriodRoutes()
  const applyFiltersHandler = new ApplyFiltersRoutes()
  const dailySummaryHandler = new DailySummaryRoutes(activitiesService)
  const dailyAttendanceHandler = new DailyAttendanceRoutes(activitiesService, prisonService)
  const cancelledSessionsHandler = new CancelledSessionsRoutes(activitiesService)
  const suspendedPrisonersHandler = new SuspendedPrisonersRoutes(activitiesService, prisonService)
  const notAttendedSelectDateHandler = new NotAttendedSelectDateRoutes()

  router.use(insertJourneyIdentifier())
  get('/:journeyId/select-period', selectPeriodHandler.GET)
  post('/:journeyId/select-period', selectPeriodHandler.POST, TimePeriod)
  get('/:journeyId/summary', dailySummaryHandler.GET)
  get('/:journeyId/attendance', dailyAttendanceHandler.GET)
  get('/:journeyId/cancelled-sessions', cancelledSessionsHandler.GET, true)
  get('/:journeyId/suspended-prisoners', suspendedPrisonersHandler.GET, true)
  get('/:journeyId/not-attended-select-date', notAttendedSelectDateHandler.GET)
  post('/:journeyId/not-attended-select-date', notAttendedSelectDateHandler.POST, NotAttendedDate)
  post('/:journeyId/update-filters', applyFiltersHandler.APPLY, Filters)

  return router
}
