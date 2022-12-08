import { Router } from 'express'
import asyncMiddleware from '../../../../middleware/asyncMiddleware'
import { Services } from '../../../../services'
import fetchOffenderList from '../../../../middleware/fetchOffenderList'
import IdentifyCandidatesRouteHandler from './handlers/IdentifyCandidatesRouteHandler'

export default ({ prisonService }: Services): Router => {
  const router = Router({ mergeParams: true })
  const identifyCandidatesRouteHandler = new IdentifyCandidatesRouteHandler(prisonService)
  router.get('/', fetchOffenderList(prisonService), asyncMiddleware(identifyCandidatesRouteHandler.GET))
  router.post('/', asyncMiddleware(identifyCandidatesRouteHandler.POST))
  return router
}
