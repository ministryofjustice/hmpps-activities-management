import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import SearchRoutes, { Search } from './handlers/search'
import SelectDateRoutes, { SelectDate } from './handlers/select-date'
import { Services } from '../../../services'
import validationMiddleware from '../../../middleware/validationMiddleware'

export default function Index({ activitiesService, prisonService }: Services): Router {
  const router = Router()
  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const searchRoutes = new SearchRoutes(activitiesService, prisonService)
  const selectDateRoutes = new SelectDateRoutes()

  get('/', searchRoutes.GET)
  post('/', searchRoutes.POST, Search)

  get('/select-date', selectDateRoutes.GET)
  post('/select-date', selectDateRoutes.POST, SelectDate)

  return router
}
