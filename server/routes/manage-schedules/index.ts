import { Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import { Services } from '../../services'
import ActivitiesRoutes from './handlers/activities'
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
  return router
}
