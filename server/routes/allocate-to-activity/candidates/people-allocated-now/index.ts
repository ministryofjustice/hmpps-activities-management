import { Router } from 'express'
import asyncMiddleware from '../../../../middleware/asyncMiddleware'
import { Services } from '../../../../services'
import PeopleAllocatedNowRouteHandler from './handlers/PeopleAllocatedNowRouteHandler'

export default ({ prisonService, activitiesService }: Services): Router => {
  const router = Router({ mergeParams: true })
  const peopleAllocatedNowRouteHandler = new PeopleAllocatedNowRouteHandler(activitiesService, prisonService)
  router.get('/', asyncMiddleware(peopleAllocatedNowRouteHandler.GET))
  return router
}
