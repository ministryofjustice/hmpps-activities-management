import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import SelectDateAndLocationRoutes, { DateAndLocation } from './handlers/selectDateAndLocation'
import { Services } from '../../services'
import validationMiddleware from '../../middleware/validationMiddleware'

export default function Index({ activitiesService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const dateAndLocationHandler = new SelectDateAndLocationRoutes(activitiesService)

  get('/unlock-list/select-date-and-location', dateAndLocationHandler.GET)
  post('/unlock-list/select-date-and-location', dateAndLocationHandler.POST, DateAndLocation)

  return router
}
