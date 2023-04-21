import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import SearchRoutes from './handlers/search'
import { Services } from '../../../services'

export default function Index({ activitiesService, prisonService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))

  const searchHandler = new SearchRoutes(activitiesService, prisonService)

  get('/', searchHandler.GET)

  return router
}
