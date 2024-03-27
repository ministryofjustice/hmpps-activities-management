import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import ViewAllocationsRoutes from './handlers/viewAllocations'
import validationMiddleware from '../../../middleware/validationMiddleware'
import SelectPrisonerRoutes, { PrisonerSearch, SelectPrisoner } from './handlers/selectPrisoner'
import insertJourneyIdentifier from '../../../middleware/insertJourneyIdentifier'
import initialiseSuspendJourney from './middlewares/initialiseSuspendJourney'
import suspendRoutes from './suspendRoutes'
import unsuspendRoutes from './unsuspendRoutes'
import ViewSuspensionsRoutes from './handlers/viewSuspensions'

export default function Index(services: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

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

  router.use('/:mode(suspend|unsuspend)/:prisonerNumber', insertJourneyIdentifier())

  router.use(
    '/:mode(suspend)/:prisonerNumber/:journeyId',
    initialiseSuspendJourney(services.prisonService, services.activitiesService),
    suspendRoutes(services),
  )

  router.use(
    '/:mode(unsuspend)/:prisonerNumber/:journeyId',
    initialiseSuspendJourney(services.prisonService, services.activitiesService),
    unsuspendRoutes(services),
  )

  return router
}
