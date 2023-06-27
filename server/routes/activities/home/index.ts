import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import HomeRoutes from './handlers/home'

export default function Index(): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const activitiesDashboardHandler = new HomeRoutes()

  get('/', activitiesDashboardHandler.GET)

  return router
}
