import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import CategoriesRoutes from './handlers/categories'
import { Services } from '../../services'
import ActivitiesRoutes from './handlers/activities'
import SchedulesRoutes from './handlers/schedules'

export default function Index({ activitiesService, capacitiesService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const categoriesHandler = new CategoriesRoutes(activitiesService, capacitiesService)
  const activitiesHandler = new ActivitiesRoutes(activitiesService, capacitiesService)
  const schedulesHandler = new SchedulesRoutes(activitiesService, capacitiesService)

  get('/categories', categoriesHandler.GET)
  get('/categories/:categoryId/activities', activitiesHandler.GET)
  get('/activities/:activityId/schedules', schedulesHandler.GET)

  return router
}
