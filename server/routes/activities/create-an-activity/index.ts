import { Router } from 'express'
import { Services } from '../../../services'
import createAndEditRoutes from './createAndEditRoutes'
import createRoutes from './createRoutes'
import scheduleRoutes from '../manage-schedules/index'
import insertJourneyIdentifier from '../../../middleware/insertJourneyIdentifier'
import initialiseEditJourney from '../../../middleware/activities/initialiseEditJourney'

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
  // Can be removed once duplicate check-pay handler removed
  router.use(
    '/:mode(edit)/:activityId(\\d+)/:journeyId/schedule',
    initialiseEditJourney(activitiesService),
    scheduleRoutes(services),
  )

  return router
}
