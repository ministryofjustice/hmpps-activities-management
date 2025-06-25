import { RequestHandler, Router } from 'express'
import SelectDateAndLocationRoutes, { DateAndLocation } from './handlers/selectDateAndLocation'
import PlannedEventsRoutes from './handlers/plannedEvents'
import { Services } from '../../../services'
import validationMiddleware from '../../../middleware/validationMiddleware'
import HomeRoutes from './handlers/home'
import insertJourneyIdentifier from '../../../middleware/insertJourneyIdentifier'
import ApplyFiltersRoutes, { Filters } from './handlers/applyFilters'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'

export default function Index({
  unlockListService,
  activitiesService,
  metricsService,
  alertsFilterService,
}: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('unlockListJourney', stepRequiresSession), handler)
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), handler)

  const homeHandler = new HomeRoutes()
  const dateAndLocationHandler = new SelectDateAndLocationRoutes(activitiesService)
  const plannedEventsHandler = new PlannedEventsRoutes(
    activitiesService,
    unlockListService,
    metricsService,
    alertsFilterService,
  )
  const applyFiltersHandler = new ApplyFiltersRoutes()

  get('/', homeHandler.GET)

  router.use(insertJourneyIdentifier())
  get('/:journeyId/select-date-and-location', dateAndLocationHandler.GET)
  post('/:journeyId/select-date-and-location', dateAndLocationHandler.POST, DateAndLocation)
  get('/:journeyId/planned-events', plannedEventsHandler.GET, true)
  post('/:journeyId/update-filters', applyFiltersHandler.APPLY, Filters)

  return router
}
