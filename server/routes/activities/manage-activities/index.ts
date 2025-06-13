import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import ActivitiesRoutes from './handlers/activities'
import ActivityRoutes from './handlers/activity'

export default function Index(services: Services): Router {
  const { activitiesService, prisonService, ukBankHolidayService } = services

  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, handler)

  const activitiesListRouteHandler = new ActivitiesRoutes(activitiesService)
  const activityRouteHandler = new ActivityRoutes(activitiesService, prisonService, ukBankHolidayService)

  get('/dashboard', activitiesListRouteHandler.GET)
  get('/view/:activityId(\\d+)', activityRouteHandler.GET)

  return router
}
