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

  const searchHandler = new SearchRoutes(activitiesService, prisonService)
  const selectDateHandler = new SelectDateRoutes()

  get('/', searchHandler.GET)
  post('/', searchHandler.POST, Search)

  get('/select-date', selectDateHandler.GET)
  post('/select-date', selectDateHandler.POST, SelectDate)

  return router
}
