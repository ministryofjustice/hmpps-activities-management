import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import HomeRoutes from './handlers/home'
import ChangeLocationRoutes from './handlers/changeLocation'
import { Services } from '../../services'

export default function Index({ userService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  const homeHandler = new HomeRoutes()
  const changeLocationHandler = new ChangeLocationRoutes(userService)

  get('/', homeHandler.GET)
  get('/change-location', changeLocationHandler.GET)
  post('/change-location', changeLocationHandler.POST)

  return router
}
