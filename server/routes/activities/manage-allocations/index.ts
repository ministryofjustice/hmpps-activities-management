import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import insertJourneyIdentifier from '../../../middleware/insertJourneyIdentifier'
import createRoutes from './createRoutes'
import editRoutes from './editRoutes'
import excludeRoutes from './excludeRoutes'
import removeRoutes from './removeRoutes'
import ViewAllocationRoutes from './handlers/viewAllocation'
import initialiseEditAndRemoveJourney from './middlewares/initialiseEditAndRemoveJourney'

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

  router.use('/:mode/:journeyId', (req, res, next) => {
    if (req.params.mode === 'create') {
      createRoutes(services)
    }
    if (req.params.mode === 'remove') {
      initialiseEditAndRemoveJourney(services.prisonService, services.activitiesService)
      removeRoutes(services)
    }
    next()
  })
  router.use('/:mode/:allocationId/:journeyId', (req, res, next) => {
    if (req.params.mode === 'edit') {
      initialiseEditAndRemoveJourney(services.prisonService, services.activitiesService)
      editRoutes(services)
    }
    if (req.params.mode === 'exclude') {
      initialiseEditAndRemoveJourney(services.prisonService, services.activitiesService)
      excludeRoutes(services)
    }
    next()
  })

  return router
}
