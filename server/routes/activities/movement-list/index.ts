import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import ChooseDetailsRoutes, { DateAndTimeSlot } from './handlers/chooseDetails'
import LocationsRoutes from './handlers/locations'
import LocationEventsRoutes from './handlers/locationEvents'
import ApplyFiltersRoutes, { Filters } from './handlers/applyFilters'
import insertJourneyIdentifier from '../../../middleware/insertJourneyIdentifier'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'

export default function Index({ activitiesService, prisonService, alertsFilterService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(path, emptyJourneyHandler('movementListJourney', stepRequiresSession), asyncMiddleware(handler))

  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const chooseDetailsRoutes = new ChooseDetailsRoutes()
  const locationsRoutes = new LocationsRoutes(activitiesService)
  const locationEventsRoutes = new LocationEventsRoutes(activitiesService, prisonService, alertsFilterService)
  const applyFiltersHandler = new ApplyFiltersRoutes()

  router.use(insertJourneyIdentifier())
  get('/:journeyId/choose-details', chooseDetailsRoutes.GET)
  post('/:journeyId/choose-details', chooseDetailsRoutes.POST, DateAndTimeSlot)
  get('/:journeyId/locations', locationsRoutes.GET)
  get('/:journeyId/location-events', locationEventsRoutes.GET)
  post('/:journeyId/update-filters', applyFiltersHandler.APPLY, Filters)

  return router
}
