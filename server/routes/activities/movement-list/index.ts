import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import validationMiddleware from '../../../middleware/validationMiddleware'
import ChooseDetailsRoutes, { DateAndTimeSlot } from './handlers/chooseDetails'
import LocationsRoutes from './handlers/locations'
import LocationEventsRoutes from './handlers/locationEvents'
import ApplyFiltersRoutes, { Filters } from './handlers/applyFilters'
import insertJourneyIdentifier from '../../../middleware/insertJourneyIdentifier'
import emptyJourneyHandler from '../../../middleware/emptyJourneyHandler'
import setUpJourneyData from '../../../middleware/setUpJourneyData'

export default function Index({ activitiesService, prisonService, alertsFilterService, tokenStore }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler, stepRequiresSession = false) =>
    router.get(
      path,
      setUpJourneyData(tokenStore),
      emptyJourneyHandler('movementListJourney', stepRequiresSession),
      handler,
    )

  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), setUpJourneyData(tokenStore), handler)

  const chooseDetailsRoutes = new ChooseDetailsRoutes()
  const locationsRoutes = new LocationsRoutes(activitiesService)
  const locationEventsRoutes = new LocationEventsRoutes(activitiesService, prisonService, alertsFilterService)
  const applyFiltersHandler = new ApplyFiltersRoutes()

  router.use(insertJourneyIdentifier())

  get('/:journeyId/choose-details', chooseDetailsRoutes.GET)
  post('/:journeyId/choose-details', chooseDetailsRoutes.POST, DateAndTimeSlot)
  get('/:journeyId/locations', locationsRoutes.GET, true)
  get('/:journeyId/location-events', locationEventsRoutes.GET, true)
  post('/:journeyId/update-filters', applyFiltersHandler.APPLY, Filters)

  return router
}
