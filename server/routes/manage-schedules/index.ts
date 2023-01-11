import { Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import { Services } from '../../services'
import ActivitiesRoutes from './handlers/activities'

export default function Index({ activitiesService }: Services): Router {
  const router = Router({ mergeParams: true })
  const activitiesListRouteHandler = new ActivitiesRoutes(activitiesService)
  router.get('/activities', asyncMiddleware(activitiesListRouteHandler.GET))
  return router
}
