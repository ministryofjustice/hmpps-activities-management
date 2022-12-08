import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import CategoriesRoutes from './handlers/categories'
import { Services } from '../../services'
import ActivitiesRoutes from './handlers/activities'
import SchedulesRoutes from './handlers/schedules'
import candidatesRoutes from './candidates'

export default function Index(services: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const categoriesHandler = new CategoriesRoutes(services.activitiesService, services.capacitiesService)
  const activitiesHandler = new ActivitiesRoutes(services.activitiesService, services.capacitiesService)
  const schedulesHandler = new SchedulesRoutes(services.activitiesService, services.capacitiesService)

  get('/categories', categoriesHandler.GET)
  get('/categories/:categoryId/activities', activitiesHandler.GET)
  get('/activities/:activityId/schedules', schedulesHandler.GET)

  router.use('/:scheduleId/candidates', candidatesRoutes(services))
  return router
}
