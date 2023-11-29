import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import insertJourneyIdentifier from '../../../middleware/insertJourneyIdentifier'
import createRoutes from './createRoutes'
import editRoutes from './editRoutes'
import excludeRoutes from './excludeRoutes'
import removeRoutes from './removeRoutes'
import ViewAllocationRoutes from './handlers/viewAllocation'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import initialiseEditAndRemoveJourney from './middlewares/initialiseEditAndRemoveJourney'

export default function Index(services: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const viewAllocationHandler = new ViewAllocationRoutes(services.activitiesService, services.prisonService)

  get('/', (req, res) => res.render('pages/activities/manage-allocations/home'))
  get('/view/:allocationId(\\d+)', viewAllocationHandler.GET)

  router.use('/:mode(create)', insertJourneyIdentifier())
  router.use('/:mode(edit)/:allocationId(\\d+)', insertJourneyIdentifier())
  router.use('/:mode(exclude)/:allocationId(\\d+)', insertJourneyIdentifier())
  router.use('/:mode(remove)', insertJourneyIdentifier())

  router.use('/:mode(create)/:journeyId', createRoutes(services))
  router.use(
    '/:mode(edit)/:allocationId(\\d+)/:journeyId',
    initialiseEditAndRemoveJourney(services.prisonService, services.activitiesService),
    editRoutes(services),
  )
  router.use(
    '/:mode(exclude)/:allocationId(\\d+)/:journeyId',
    initialiseEditAndRemoveJourney(services.prisonService, services.activitiesService),
    excludeRoutes(services),
  )
  router.use(
    '/:mode(remove)/:journeyId',
    initialiseEditAndRemoveJourney(services.prisonService, services.activitiesService),
    removeRoutes(services),
  )

  return router
}
