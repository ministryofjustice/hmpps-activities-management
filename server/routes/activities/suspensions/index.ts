import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import ViewAllocationsRoutes from './handlers/viewAllocations'
import validationMiddleware from '../../../middleware/validationMiddleware'
import SelectPrisonerRoutes, { PrisonerSearch, SelectPrisoner } from './handlers/selectPrisoner'
import insertJourneyIdentifier from '../../../middleware/insertJourneyIdentifier'
import initialiseSuspendJourney from './middlewares/initialiseSuspendJourney'
import suspendRoutes from './suspendRoutes'
import unsuspendRoutes from './unsuspendRoutes'
import ViewSuspensionsRoutes from './handlers/viewSuspensions'
import insertRouteContext from '../../../middleware/routeContext'

export default function Index(services: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler) => router.get(path, handler)
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), handler)

  const viewAllocationsHandler = new ViewAllocationsRoutes(services.activitiesService, services.prisonService)
  const viewSuspensionsHandler = new ViewSuspensionsRoutes(
    services.activitiesService,
    services.caseNotesService,
    services.userService,
  )
  const selectPrisonerRoutes = new SelectPrisonerRoutes(services.prisonService)

  get('/prisoner/:prisonerNumber', viewAllocationsHandler.GET)
  get('/prisoner/:prisonerNumber/view-suspensions', viewSuspensionsHandler.GET)
  get('/select-prisoner', selectPrisonerRoutes.GET)
  post('/search-prisoner', selectPrisonerRoutes.SEARCH, PrisonerSearch)
  post('/select-prisoner', selectPrisonerRoutes.SELECT_PRISONER, SelectPrisoner)

  router.use(['/suspend/:prisonerNumber', '/unsuspend/:prisonerNumber'], insertJourneyIdentifier())

  router.use(
    '/suspend/:prisonerNumber/:journeyId',
    insertRouteContext('suspend'),
    initialiseSuspendJourney(services.prisonService, services.activitiesService),
    suspendRoutes(services),
  )
  router.use(
    '/unsuspend/:prisonerNumber/:journeyId',
    insertRouteContext('unsuspend'),
    initialiseSuspendJourney(services.prisonService, services.activitiesService),
    unsuspendRoutes(services),
  )

  return router
}
