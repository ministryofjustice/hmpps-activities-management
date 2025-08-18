import { Router } from 'express'
import { Services } from '../../../services'
import createAndEditRoutes from './createAndEditRoutes'
import createRoutes from './createRoutes'
import insertJourneyIdentifier from '../../../middleware/insertJourneyIdentifier'
import initialiseEditJourney from './middlewares/initialiseEditJourney'
import insertRouteContext from '../../../middleware/routeContext'
import setUpJourneyData from '../../../middleware/setUpJourneyData'

export default function Index(services: Services): Router {
  const { activitiesService } = services

  const router = Router({ mergeParams: true })

  router.use('/create', insertJourneyIdentifier())
  router.use('/create/:journeyId', insertRouteContext('create'), createRoutes(services), createAndEditRoutes(services))

  router.use('/edit/:activityId', insertJourneyIdentifier())
  router.use(
    '/edit/:activityId/:journeyId',
    insertRouteContext('edit'),
    setUpJourneyData(services.tokenStore),
    initialiseEditJourney(activitiesService),
    createAndEditRoutes(services),
  )

  return router
}
