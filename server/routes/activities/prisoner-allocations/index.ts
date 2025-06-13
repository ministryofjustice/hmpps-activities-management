import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import { Services } from '../../../services'
import validationMiddleware from '../../../middleware/validationMiddleware'
import PrisonerAllocationsHandler from './handlers/prisonerAllocations'
import NonAssociationsHandler from './handlers/nonAssociations'
import populatePrisonerProfile from '../../../middleware/populatePrisonerProfile'

export default function Index({ activitiesService, prisonService, nonAssociationsService }: Services): Router {
  const router = Router({ mergeParams: true })
  const getWithProfile = (path: string, handler: RequestHandler) =>
    router.get(path, populatePrisonerProfile(prisonService), asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

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

  getWithProfile('/:prisonerNumber', prisonerAllocationsHandler.GET)
  post('/:prisonerNumber', prisonerAllocationsHandler.POST)
  getWithProfile('/:prisonerNumber/non-associations', prisonerNonAssociationsHandler.GET)

  return router
}
