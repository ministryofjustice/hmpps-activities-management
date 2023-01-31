import { Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import { Services } from '../../services'
import ActivitiesRoutes from './handlers/activities'
import ActivityRoutes from './handlers/activity'
import CancelRoutes from './handlers/cancel'
import createScheduleRoutes from './create-schedule'
import fetchActivity from '../../middleware/fetchActivity'

export default function Index(services: Services): Router {
  const router = Router({ mergeParams: true })
  router.use(
    '/activities/:id/create-schedule',
    fetchActivity(services.activitiesService),
    createScheduleRoutes(services),
  )
  const activitiesListRouteHandler = new ActivitiesRoutes(services.activitiesService)
  router.get('/activities', asyncMiddleware(activitiesListRouteHandler.GET))
  const activityRouteHandler = new ActivityRoutes(services.activitiesService)
  router.get('/activities/:activityId', asyncMiddleware(activityRouteHandler.GET))
  const cancelRouteHandler = new CancelRoutes()
  router.get('/activities/cancel', asyncMiddleware(cancelRouteHandler.GET))
  return router
}
