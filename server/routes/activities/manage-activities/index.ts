import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import { Services } from '../../../services'
import ActivitiesRoutes from './handlers/activities'
import ActivityRoutes from './handlers/activity'

export default function Index(services: Services): Router {
  const { activitiesService, prisonService } = services

  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const activitiesListRouteHandler = new ActivitiesRoutes(activitiesService)
  const activityRouteHandler = new ActivityRoutes(activitiesService, prisonService)

  get('/dashboard', activitiesListRouteHandler.GET)
  get('/view/:activityId(\\d+)', activityRouteHandler.GET)

  return router
}
