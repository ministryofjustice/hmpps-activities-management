import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import validationMiddleware from '../../../middleware/validationMiddleware'
import PrisonerAllocationsHandler from './handlers/prisonerAllocations'
import NonAssociationsHandler from './handlers/nonAssociations'
import populatePrisonerProfile from '../../../middleware/populatePrisonerProfile'
import PrisonerWaitlistHandler, { SelectWailistOptions } from './handlers/prisonerWaitlistAllocations'
import ActivityAllocationHandler, { FromActivityList } from './handlers/prisonerActivityAllocations'
import setUpJourneyData from '../../../middleware/setUpJourneyData'
import PendingWaitlistHandler, { allocateOption } from './handlers/pendingWaitlistAllocations'
import insertJourneyIdentifier from '../../../middleware/insertJourneyIdentifier'

export default function Index({
  activitiesService,
  prisonService,
  nonAssociationsService,
  tokenStore,
}: Services): Router {
  const router = Router({ mergeParams: true })
  const getWithProfile = (path: string, handler: RequestHandler) =>
    router.get(path, populatePrisonerProfile(prisonService), handler)
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, setUpJourneyData(tokenStore), validationMiddleware(type), handler)
  const get = (path: string, handler: RequestHandler) => router.get(path, setUpJourneyData(tokenStore), handler)

  const prisonerAllocationsHandler = new PrisonerAllocationsHandler(
    activitiesService,
    prisonService,
    nonAssociationsService,
  )
  const prisonerNonAssociationsHandler = new NonAssociationsHandler(
    activitiesService,
    prisonService,
    nonAssociationsService,
  )

  const activityAllocationHandler = new ActivityAllocationHandler(activitiesService)
  const pendingWaitlistHandler = new PendingWaitlistHandler(activitiesService, prisonService)
  const prisonerWaitlistHandler = new PrisonerWaitlistHandler(activitiesService, prisonService)

  getWithProfile('/:prisonerNumber', prisonerAllocationsHandler.GET)
  post('/:prisonerNumber', prisonerAllocationsHandler.POST)
  getWithProfile('/:prisonerNumber/non-associations', prisonerNonAssociationsHandler.GET)
  get('/:prisonerNumber/select-activity', activityAllocationHandler.GET)
  post('/:prisonerNumber/select-activity', activityAllocationHandler.POST, FromActivityList)

  router.use('/allocate/:prisonerNumber', insertJourneyIdentifier())

  get('/allocate/:prisonerNumber/:journeyId/waitlist-allocation', prisonerWaitlistHandler.GET)
  post('/allocate/:prisonerNumber/:journeyId/waitlist-allocation', prisonerWaitlistHandler.POST, SelectWailistOptions)

  get('/allocate/:prisonerNumber/:journeyId/pending-application', pendingWaitlistHandler.GET)
  post('/allocate/:prisonerNumber/:journeyId/pending-application', pendingWaitlistHandler.POST, allocateOption)

  return router
}
