import { RequestHandler, Router } from 'express'
import { Services } from '../../../services'
import asyncMiddleware from '../../../middleware/asyncMiddleware'
import validationMiddleware from '../../../middleware/validationMiddleware'
import SelectDateRoutes, { SelectDate } from './handlers/selectDate'
import SummariesRoutes from './handlers/summaries'

export default function Index({ activitiesService, prisonService }: Services): Router {
  const router = Router({ mergeParams: true })

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const selectDateRoutes = new SelectDateRoutes()
  const summariesRoutes = new SummariesRoutes(activitiesService, prisonService)

  get('/select-date', selectDateRoutes.GET)
  post('/select-date', selectDateRoutes.POST, SelectDate)
  get('/summaries', summariesRoutes.GET)

  return router
}
