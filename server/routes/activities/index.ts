import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import ActivitiesDashboardRoutes from './handlers/dashboard'

export default function Index(): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const activitiesDashboardHandler = new ActivitiesDashboardRoutes()

  get('/activities/dashboard', activitiesDashboardHandler.GET)

  return router
}
