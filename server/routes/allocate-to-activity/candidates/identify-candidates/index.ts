import { Router } from 'express'
import asyncMiddleware from '../../../../middleware/asyncMiddleware'
import { Services } from '../../../../services'
import IdentifyCandidatesRouteHandler from './handlers/IdentifyCandidatesRouteHandler'

export default ({ prisonService, capacitiesService, activitiesService }: Services): Router => {
  const router = Router({ mergeParams: true })
  const identifyCandidatesRouteHandler = new IdentifyCandidatesRouteHandler(
    prisonService,
    capacitiesService,
    activitiesService,
  )
  router.get('/', asyncMiddleware(identifyCandidatesRouteHandler.GET))
  router.post('/', asyncMiddleware(identifyCandidatesRouteHandler.POST))
  return router
}
