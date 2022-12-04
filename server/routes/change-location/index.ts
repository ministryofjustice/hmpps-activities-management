import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import ChangeLocationRoutes from './handlers/changeLocation'
import { Services } from '../../services'

export default function Index({ userService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler) => router.post(path, asyncMiddleware(handler))

  const changeLocationHandler = new ChangeLocationRoutes(userService)

  get('/', changeLocationHandler.GET)
  post('/', changeLocationHandler.POST)

  return router
}
