import { Router } from 'express'
import { Services } from '../../../services'
import createAndEditRoutes from './createAndEditRoutes'
import createRoutes from './createRoutes'
import insertJourneyIdentifier from '../../../middleware/insertJourneyIdentifier'
import initialiseEditJourney from './middlewares/initialiseEditJourney'

export default function Index(services: Services): Router {
  const { activitiesService } = services

  const router = Router({ mergeParams: true })

  router.use('/:mode(create)', insertJourneyIdentifier())
  router.use('/:mode(create)/:journeyId', createRoutes(services), createAndEditRoutes(services))

  router.use('/:mode(edit)/:activityId(\\d+)', insertJourneyIdentifier())
  router.use(
    '/:mode(edit)/:activityId(\\d+)/:journeyId',
    initialiseEditJourney(activitiesService),
    createAndEditRoutes(services),
  )

  return router
}
