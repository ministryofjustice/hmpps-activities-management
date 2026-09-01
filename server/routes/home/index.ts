import { RequestHandler, Router } from 'express'
import HomeRoutes from './handlers/home'

export default function Index(): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, handler)

  const homeHandler = new HomeRoutes()

  get('/', homeHandler.GET)
  get('/activities-accessibility-statement', homeHandler.ACTIVITIES_ACCESSIBILITY_STATEMENT)
  get('/appointments-accessibility-statement', homeHandler.APPOINTMENTS_ACCESSIBILITY_STATEMENT)

  return router
}
