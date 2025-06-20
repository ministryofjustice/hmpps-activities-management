import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import insertJourneyIdentifier from '../../../middleware/insertJourneyIdentifier'
import createRoutes from './createRoutes'
import editRoutes from './editRoutes'
import excludeRoutes from './excludeRoutes'
import removeRoutes from './removeRoutes'
import ViewAllocationRoutes from './handlers/viewAllocation'
import initialiseEditAndRemoveJourney from './middlewares/initialiseEditAndRemoveJourney'
import insertRouteContext from '../../../middleware/routeContext'

export default function Index(services: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler) => router.get(path, handler)

  const viewAllocationHandler = new ViewAllocationRoutes(
    services.activitiesService,
    services.prisonService,
    services.caseNotesService,
    services.userService,
  )

  get('/', (req, res) => res.render('pages/activities/manage-allocations/home'))
  get('/view/:allocationId', viewAllocationHandler.GET)

  router.use('/create', insertJourneyIdentifier())
  router.use('/edit/:allocationId', insertJourneyIdentifier())
  router.use('/exclude/:allocationId', insertJourneyIdentifier())
  router.use('/remove', insertJourneyIdentifier())

  router.use('/create/:journeyId', insertRouteContext('create'), createRoutes(services))
  router.use(
    '/remove/:journeyId',
    insertRouteContext('remove'),
    initialiseEditAndRemoveJourney(services.prisonService, services.activitiesService),
    removeRoutes(services),
  )
  router.use(
    '/edit/:allocationId/:journeyId',
    insertRouteContext('edit'),
    initialiseEditAndRemoveJourney(services.prisonService, services.activitiesService),
    editRoutes(services),
  )
  router.use(
    '/exclude/:allocationId/:journeyId',
    insertRouteContext('exclude'),
    initialiseEditAndRemoveJourney(services.prisonService, services.activitiesService),
    excludeRoutes(services),
  )

  return router
}
