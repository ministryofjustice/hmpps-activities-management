import { Router } from 'express'
import { Services } from '../../../services'
import createAndEditRoutes from './createAndEditRoutes'
import createRoutes from './createRoutes'
import insertJourneyIdentifier from '../../../middleware/insertJourneyIdentifier'
import initialiseEditJourney from './middlewares/initialiseEditJourney'

export default function Index(services: Services): Router {
  const { activitiesService } = services

  const router = Router({ mergeParams: true })

  router.use('/create', insertJourneyIdentifier())
  router.use('/:mode/:journeyId', (req, res, next) => {
    if (req.params.mode === 'create') {
      createRoutes(services)
      createAndEditRoutes(services)
    }
    next()
  })

  router.use('/edit/:activityId', insertJourneyIdentifier())
  router.use('/:mode/:activityId/:journeyId', (req, res, next) => {
    if (req.params.mode === 'edit') {
      initialiseEditJourney(activitiesService)
      createAndEditRoutes(services)
    }
    next()
  })

  return router
}
