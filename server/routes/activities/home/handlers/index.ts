import { RequestHandler, Router } from 'express'
import HomeRoutes from './home'

export default function Index(): Router {
  const router = Router({ mergeParams: true })
  const get = (path: string, handler: RequestHandler) => router.get(path, handler)

  const activitiesDashboardHandler = new HomeRoutes()

  get('/', activitiesDashboardHandler.GET)

  return router
}
