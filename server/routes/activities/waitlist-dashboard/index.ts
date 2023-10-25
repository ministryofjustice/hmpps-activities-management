import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import DashboardRoutes, { DashboardFrom } from './handlers/dashboard'
import validationMiddleware from '../../../middleware/validationMiddleware'

export default function Index({ activitiesService, prisonService }: Services): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const dashboardRoutes = new DashboardRoutes(activitiesService, prisonService)

  get('/', dashboardRoutes.GET)
  post('/', dashboardRoutes.POST, DashboardFrom)
  post('/view-application', dashboardRoutes.VIEW_APPLICATION)
  post('/allocate', dashboardRoutes.ALLOCATE)

  return router
}
