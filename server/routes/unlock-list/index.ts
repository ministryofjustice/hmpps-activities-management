import { RequestHandler, Router } from 'express'
import asyncMiddleware from '../../middleware/asyncMiddleware'
import SelectDateAndLocationRoutes, { DateAndLocation } from './handlers/selectDateAndLocation'
import PlannedEventsRoutes from './handlers/plannedEvents'
import { Services } from '../../services'
import validationMiddleware from '../../middleware/validationMiddleware'

export default function Index({ activitiesService }: Services): Router {
  const router = Router()

  const get = (path: string, handler: RequestHandler) => router.get(path, asyncMiddleware(handler))
  const post = (path: string, handler: RequestHandler, type?: new () => object) =>
    router.post(path, validationMiddleware(type), asyncMiddleware(handler))

  const dateAndLocationHandler = new SelectDateAndLocationRoutes(activitiesService)
  const plannedEventsHandler = new PlannedEventsRoutes(activitiesService)

  get('/select-date-and-location', dateAndLocationHandler.GET)
  post('/select-date-and-location', dateAndLocationHandler.POST, DateAndLocation)
  get('/planned-events', plannedEventsHandler.GET)

  return router
}
