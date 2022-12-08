import { Router } from 'express'
import asyncMiddleware from '../../../../middleware/asyncMiddleware'
import { Services } from '../../../../services'
import PeopleAllocatedNowRouteHandler from './handlers/PeopleAllocatedNowRouteHandler'

export default ({ prisonService, capacitiesService, activitiesService }: Services): Router => {
  const router = Router({ mergeParams: true })
  const peopleAllocatedNowRouteHandler = new PeopleAllocatedNowRouteHandler(
    prisonService,
    capacitiesService,
    activitiesService,
  )
  router.get('/', asyncMiddleware(peopleAllocatedNowRouteHandler.GET))
  return router
}
