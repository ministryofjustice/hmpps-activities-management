import { Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import { Services } from '../../../services'
import ActivitiesRoutes from './handlers/activities'
import ActivityRoutes from './handlers/activity'
import CheckPayRoutes from './handlers/checkPay'

export default function Index(services: Services): Router {
  const router = Router({ mergeParams: true })
  const activitiesListRouteHandler = new ActivitiesRoutes(services.activitiesService)
  router.get('/activities', asyncMiddleware(activitiesListRouteHandler.GET))
  const activityRouteHandler = new ActivityRoutes(services.activitiesService, services.prisonService)
  router.get('/activities/:activityId', asyncMiddleware(activityRouteHandler.GET))
  const checkPayRouteHandler = new CheckPayRoutes(services.activitiesService, services.prisonService)
  router.get('/check-pay', asyncMiddleware(checkPayRouteHandler.GET))
  router.post('/check-pay', asyncMiddleware(checkPayRouteHandler.POST))
  return router
}
